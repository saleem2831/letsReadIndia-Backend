

import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import PDFDocument from "pdfkit";
import {
  createShiprocketOrder,
  checkServiceability,
  assignAWB,
} from "../services/shiprocket.service.js";
import razorpay from "../config/razorpay.js";
import { notifyOrderChanged } from "../utils/realtime.js";



/* CREATE ADMIN */
export const createAdmin = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim().slice(0, 100);
    const email = String(req.body.email || "").trim().toLowerCase().slice(0, 100);
    const password = String(req.body.password || "");
    const role = req.body.role === "super_admin" ? "super_admin" : "admin";
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "A valid name and email are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must contain at least 8 characters" });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO admins(name,email,password,role,status) VALUES (?,?,?,?,?)',
      [name, email, hash, role, 'active']
    );
    return res.status(201).json({
      message: role === "super_admin" ? "Super admin created successfully" : "Admin created successfully",
      id: result.insertId,
      role,
    });
  } catch (error) {
    return res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
      message: error.code === "ER_DUP_ENTRY" ? "An account with this email already exists" : "Unable to create account",
    });
  }
};

export const getSuperAdmins = async (_req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id,name,email,status,created_at FROM admins WHERE role='super_admin' ORDER BY created_at ASC",
    );
    return res.json({ data: rows });
  } catch {
    return res.status(500).json({ message: "Unable to load super admins" });
  }
};

export const changeOwnPassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.current_password || "");
    const newPassword = String(req.body.new_password || "");
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must contain at least 8 characters" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from the current password" });
    }
    const [[account]] = await db.query(
      "SELECT id,password FROM admins WHERE id=? AND role='super_admin' AND status='active'",
      [req.user.id],
    );
    if (!account || !(await bcrypt.compare(currentPassword, account.password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE admins SET password=? WHERE id=?", [hash, req.user.id]);
    return res.json({ message: "Password changed successfully. Use the new password next time you sign in." });
  } catch {
    return res.status(500).json({ message: "Unable to change password" });
  }
};



export const getAdmins = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const [admins] = await db.query(
    `
    SELECT 
      a.id,
      a.name,
      a.email,
      a.role,
      a.status,

      COUNT(o.id) AS total_orders,

      SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
      SUM(CASE WHEN o.status = 'assigned' THEN 1 ELSE 0 END) AS assigned_orders,
      SUM(CASE WHEN o.status = 'shipped' THEN 1 ELSE 0 END) AS shipped_orders,
      SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders,

      COALESCE(SUM(o.total), 0) AS total_order_value   -- ⭐ NEW

    FROM admins a
    LEFT JOIN order_assignments oa ON oa.admin_id = a.id
    LEFT JOIN orders o ON o.id = oa.order_id

    WHERE a.role = 'admin'
    GROUP BY a.id
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
    `,
    [limit, offset]
  );

  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) as count FROM admins WHERE role='admin'`
  );

  res.json({
    data: admins,
    total: count,
    page,
    pages: Math.ceil(count / limit),
  });
};

/* ENABLE / DISABLE ADMIN */
export const updateAdminStatus = async (req, res) => {
  const { status } = req.body;

  await db.query(
    'UPDATE admins SET status=? WHERE id=?',
    [status, req.params.id]
  );

  res.json({ message: 'Admin status updated' });
};

/* DELETE ADMIN */


export const deleteAdmin = async (req, res) => {
  const adminId = req.params.id;
  const { newAdminId } = req.body;

  if (!newAdminId) {
    return res.status(400).json({
      success: false,
      message: "New admin ID required for reassignment",
    });
  }

  if (adminId == newAdminId) {
    return res.status(400).json({
      success: false,
      message: "Cannot reassign to same admin",
    });
  }

  try {
    // Check if new admin exists
    const [adminCheck] = await db.query(
      "SELECT id FROM admins WHERE id = ?",
      [newAdminId]
    );

    if (adminCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Selected admin not found",
      });
    }

    // 1️⃣ Reassign orders
    await db.query(
      "UPDATE order_assignments SET admin_id = ? WHERE admin_id = ?",
      [newAdminId, adminId]
    );

    // 2️⃣ Delete old admin
    await db.query(
      "DELETE FROM admins WHERE id = ?",
      [adminId]
    );

    res.json({
      success: true,
      message: "Admin deleted and orders reassigned",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};



// /Update Admin password/ 


export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, status } = req.body;

    // check if admin exists
    const [existing] = await db.query("SELECT * FROM admins WHERE id=?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    let hashPassword = existing[0].password;

    // if password provided → hash it
    if (password) {
      hashPassword = await bcrypt.hash(password, 10);
    }

    await db.query(
      `UPDATE admins 
       SET name=?, email=?, password=?, status=? 
       WHERE id=?`,
      [
        name || existing[0].name,
        email || existing[0].email,
        hashPassword,
        status || existing[0].status,
        id,
      ]
    );

    res.json({ success: true, message: "Admin updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Admin Controllers

export const getAllOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 15;
    const offset = (page - 1) * limit;
    const search = String(req.query.search || "").trim().slice(0, 100);
    const status = ["pending", "assigned", "shipped", "delivered"].includes(req.query.status)
      ? req.query.status : "";
    const shippingMode = ["domestic", "international"].includes(req.query.shipping_mode)
      ? req.query.shipping_mode : "";
    const adminId = Number.parseInt(req.query.admin_id, 10) || 0;

    const where = [
      "(?='' OR o.order_number LIKE ? OR o.customer_name LIKE ? OR o.email LIKE ? OR o.phone LIKE ?)",
      "(?='' OR o.status=?)",
      "(?='' OR o.shipping_mode=?)",
      "(?=0 OR oa.admin_id=?)",
    ].join(" AND ");
    const filters = [
      search, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`,
      status, status, shippingMode, shippingMode, adminId, adminId,
    ];

    const [orders] = await db.query(
      `SELECT o.*,oa.admin_id,a.name AS assigned_admin_name,a.email AS assigned_admin_email,
              COALESCE(items.total_quantity,0) AS total_quantity,
              COALESCE(events.event_count,0) AS shipment_event_count
       FROM orders o
       LEFT JOIN order_assignments oa ON oa.order_id=o.id
       LEFT JOIN admins a ON a.id=oa.admin_id
       LEFT JOIN (SELECT order_id,SUM(quantity) total_quantity FROM order_items GROUP BY order_id) items
         ON items.order_id=o.id
       LEFT JOIN (SELECT order_id,COUNT(*) event_count FROM shipment_events GROUP BY order_id) events
         ON events.order_id=o.id
       WHERE ${where}
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...filters, limit, offset],
    );
    const [[countRow]] = await db.query(
      `SELECT COUNT(DISTINCT o.id) AS count FROM orders o
       LEFT JOIN order_assignments oa ON oa.order_id=o.id WHERE ${where}`,
      filters,
    );
    const [[stats]] = await db.query(
      `SELECT COUNT(*) total_orders,
              COALESCE(SUM(status='pending'),0) pending,
              COALESCE(SUM(status='assigned'),0) assigned,
              COALESCE(SUM(status='shipped'),0) shipped,
              COALESCE(SUM(status='delivered'),0) delivered,
              COALESCE(SUM(shipping_mode='international'),0) international_orders,
              COALESCE(SUM(total),0) total_value
       FROM orders`,
    );
    return res.json({
      data: orders,
      stats,
      page,
      pages: Math.max(1, Math.ceil(Number(countRow.count) / limit)),
      total: Number(countRow.count),
    });
  } catch (error) {
    console.error("SUPER ADMIN ORDERS ERROR", error);
    return res.status(500).json({ message: "Unable to load all orders" });
  }
};

export const getAllOrderDetails = async (req, res) => {
  try {
    const [[order]] = await db.query(
      `SELECT o.*,oa.admin_id,a.name AS assigned_admin_name,a.email AS assigned_admin_email
       FROM orders o
       LEFT JOIN order_assignments oa ON oa.order_id=o.id
       LEFT JOIN admins a ON a.id=oa.admin_id
       WHERE o.id=? LIMIT 1`,
      [req.params.id],
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    const [items] = await db.query(
      `SELECT oi.id,oi.product_id,p.name,oi.quantity,oi.price,p.hsn_code
       FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=? ORDER BY oi.id`,
      [req.params.id],
    );
    const [events] = await db.query(
      `SELECT id,awb,shipment_status,activity,location,event_time,created_at
       FROM shipment_events WHERE order_id=? ORDER BY COALESCE(event_time,created_at) DESC`,
      [req.params.id],
    );
    return res.json({ order, items, events });
  } catch (error) {
    console.error("SUPER ADMIN ORDER DETAILS ERROR", error);
    return res.status(500).json({ message: "Unable to load order details" });
  }
};



export const getAdminDashboard = async (req, res) => {
  try {
    const adminId = req.user.id;

    const [[stats]] = await db.query(
      `
      SELECT
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.status = 'pending'),0) AS pending,
        COALESCE(SUM(o.status = 'assigned'),0) AS assigned,
        COALESCE(SUM(o.status = 'shipped'),0) AS shipped,
        COALESCE(SUM(o.status = 'delivered'),0) AS delivered,
        COALESCE(SUM(o.total), 0) AS total_value,
        COUNT(DISTINCT o.email) AS total_customers
      FROM order_assignments oa
      JOIN orders o ON o.id = oa.order_id
      WHERE oa.admin_id = ?
      `,
      [adminId]
    );

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



export const updateOrderStatus = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["pending", "assigned", "shipped", "delivered"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [[exists]] = await db.query(
      `SELECT id FROM order_assignments WHERE order_id = ? AND admin_id = ?`,
      [id, adminId]
    );

    if (!exists) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // ✅ If status is delivered, also update delivered_at
    if (status === "delivered") {
      await db.query(
        `UPDATE orders 
         SET status = ?, delivered_at = NOW() 
         WHERE id = ?`,
        [status, id]
      );
    } else {
      await db.query(
        `UPDATE orders SET status = ?,delivered_at=NULL WHERE id = ?`,
        [status, id]
      );
    }

    await notifyOrderChanged(id, "status");
    res.json({ success: true, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAssignedOrders = async (req, res) => {
  try {
    const adminId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const search = req.query.search || "";
    const status = req.query.status || "";

    const [orders] = await db.query(
      `SELECT
        o.*,
        COALESCE(SUM(oi.quantity),0) AS total_quantity
       FROM orders o
       JOIN order_assignments oa ON oa.order_id = o.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE oa.admin_id = ?
       AND (o.order_number LIKE ? OR o.customer_name LIKE ?)
       AND (? = '' OR o.status = ?)
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [adminId, `%${search}%`, `%${search}%`, status, status, limit, offset]
    );

    const [[{ count }]] = await db.query(
      `SELECT COUNT(DISTINCT o.id) as count
       FROM orders o
       JOIN order_assignments oa ON oa.order_id = o.id
       WHERE oa.admin_id = ?
       AND (o.order_number LIKE ? OR o.customer_name LIKE ?)
       AND (? = '' OR o.status = ?)`,
      [adminId, `%${search}%`, `%${search}%`, status, status]
    );

    res.json({
      data: orders,
      page,
      pages: Math.max(1, Math.ceil(count / limit)),
      total: count,
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};


export const getOrderDetails = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const [[allowed]] = await db.query(
      `SELECT id FROM order_assignments WHERE order_id = ? AND admin_id = ?`,
      [id, adminId]
    );

    if (!allowed) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const [[order]] = await db.query(
      `SELECT o.*,a.name AS assigned_admin_name,a.email AS assigned_admin_email
       FROM orders o
       JOIN order_assignments oa ON oa.order_id=o.id
       JOIN admins a ON a.id=oa.admin_id
       WHERE o.id=? AND oa.admin_id=? LIMIT 1`,
      [id, adminId]
    );
    const [items] = await db.query(
      `SELECT
        oi.product_id,
        p.name,
        oi.quantity,
        oi.price,
        p.hsn_code
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [id]
    );
    const [events] = await db.query(
      `SELECT shipment_status,activity,location,event_time,created_at
       FROM shipment_events WHERE order_id=? ORDER BY COALESCE(event_time,created_at) DESC`,
      [id],
    );

    res.json({ order, items, events });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};



export const shipOrder = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT * FROM order_assignments WHERE order_id=? AND admin_id=?`,
      [id, adminId]
    );

    if (!rows.length) {
      return res.status(403).json({ message: "Not allowed" });
    }
    const [[order]] = await db.query(
      `SELECT * FROM orders WHERE id=?`,
      [id]
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.waybill) {
      return res.json({ success: true, shipment_id: order.shipment_id, awb: order.waybill, duplicate: true });
    }

    const [items] = await db.query(
      `SELECT p.name, oi.quantity, oi.price, oi.product_id, p.hsn_code,
              p.weight_kg,p.length_cm,p.breadth_cm,p.height_cm
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id=?`,
      [id]
    );
    if (!items.length) return res.status(400).json({ message: "This order has no shippable items" });
    const invalidInternationalHsn = items.filter((item) => {
      const hsn = String(item.hsn_code ?? "").trim().replace(/\s+/g, "");
      return !/^\d{1,15}$/.test(hsn);
    });
    if (order.shipping_mode === "international" && invalidInternationalHsn.length) {
      return res.status(400).json({
        message: `Set a numeric HSN code containing 1 to 15 digits for: ${invalidInternationalHsn.map((item) => item.name).join(", ")}`,
      });
    }

    const dimensions = {
      weight: Math.max(0.1, Number(req.body.weight) || items.reduce((sum, item) => sum + Number(item.weight_kg || .5) * Number(item.quantity), 0)),
      length: Math.max(1, Number(req.body.length) || Math.max(...items.map((item) => Number(item.length_cm || 20)))),
      breadth: Math.max(1, Number(req.body.breadth) || Math.max(...items.map((item) => Number(item.breadth_cm || 15)))),
      height: Math.max(1, Number(req.body.height) || items.reduce((sum, item) => sum + Number(item.height_cm || 5) * Number(item.quantity), 0)),
    };

    let shipmentId = order.shipment_id;
    if (!shipmentId) {
      const srOrder = await createShiprocketOrder(order, items, dimensions);
      shipmentId = srOrder?.shipment_id || srOrder?.data?.shipment_id;
      if (!shipmentId) {
        return res.status(502).json({ message: srOrder?.message || "Shiprocket did not return a shipment ID" });
      }
      await db.query(
        "UPDATE orders SET shipment_id=?,shipment_status='order_created' WHERE id=?",
        [shipmentId, id],
      );
    }

    const awbRes = await assignAWB(
      shipmentId,
      order.quoted_courier_id || undefined,
      order.shipping_mode === "international"
    );
    const awbData = awbRes?.response?.data || awbRes?.data || awbRes;
    const awbCode = awbData?.awb_code || awbData?.awb || awbRes?.awb_code;
    if (!awbCode) {
      const message = awbRes?.message || awbData?.message || "Shiprocket could not assign an AWB";
      await db.query("UPDATE orders SET shipment_status='awb_pending' WHERE id=?", [id]);
      await notifyOrderChanged(id, "shipment_pending");
      return res.status(502).json({ message });
    }

    await db.query(
      `UPDATE orders SET 
       shipment_id=?,
       waybill=?,
       courier_name=COALESCE(?,courier_name),
       shipment_status='created',
       status='shipped'
       WHERE id=?`,
      [shipmentId, awbCode, awbData?.courier_name || awbRes?.courier_name || null, id]
    );
    await notifyOrderChanged(id, "shipped");
    res.json({
      success: true,
      shipment_id: shipmentId,
      awb: awbCode,
    });

  } catch (err) {
    const details = err.response?.data;
    const fieldErrors = details?.errors && typeof details.errors === "object"
      ? Object.entries(details.errors).flatMap(([field, messages]) => {
        const list = Array.isArray(messages) ? messages : [messages];
        return list.filter(Boolean).map((message) => `${field}: ${message}`);
      })
      : [];
    const message = fieldErrors.length
      ? `Shiprocket validation failed — ${fieldErrors.join("; ")}`
      : details?.message || err.message || "Shipping failed";
    const upstreamStatus = Number(err.response?.status);
    const responseStatus = upstreamStatus >= 400 && upstreamStatus < 500 ? upstreamStatus : 502;
    console.error("SHIP ERROR:", details || err.message);
    res.status(responseStatus).json({ message });
  }
};


// export const getAllReturnRequests = async (req, res) => {
//   try {
//     const [returns] = await db.query(`
//       SELECT 
//         rr.id,
//         rr.order_id,
//         rr.order_item_id,
//         rr.reason,
//         rr.status,
//         rr.created_at,
//         o.order_number,
//         p.name AS product_name,
//         oi.quantity
//       FROM return_requests rr
//       JOIN orders o ON o.id = rr.order_id
//       JOIN order_items oi ON oi.id = rr.order_item_id
//       JOIN products p ON p.id = oi.product_id
//       ORDER BY rr.created_at DESC
//     `);

//     res.json(returns);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };



export const getAllReturnRequests = async (req, res) => {
  try {
    const [returns] = await db.query(`
      SELECT 
        rr.id,
        rr.order_id,
        rr.order_item_id,
        rr.reason,
        rr.status,
        rr.created_at,
        o.order_number,
        p.name AS product_name,
        oi.quantity
      FROM returns rr
      JOIN orders o ON o.id = rr.order_id
      JOIN order_items oi ON oi.id = rr.order_item_id
      JOIN products p ON p.id = oi.product_id
      ORDER BY rr.created_at DESC
    `);

    res.json(returns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// export const updateReturnStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const allowed = ["approved", "rejected"];
//     if (!allowed.includes(status)) {
//       return res.status(400).json({ message: "Invalid status" });
//     }

//     const [[returnRequest]] = await db.query(
//       `SELECT * FROM return_requests WHERE id = ?`,
//       [id]
//     );

//     if (!returnRequest) {
//       return res.status(404).json({ message: "Return not found" });
//     }

//     await db.query(
//       `UPDATE return_requests SET status = ? WHERE id = ?`,
//       [status, id]
//     );

//     // OPTIONAL: If approved → increase stock back
//     if (status === "approved") {
//       await db.query(`
//         UPDATE products p
//         JOIN order_items oi ON oi.product_id = p.id
//         SET p.stock = p.stock + oi.quantity
//         WHERE oi.id = ?
//       `, [returnRequest.order_item_id]);
//     }

//     res.json({ message: `Return ${status} successfully` });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


export const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["approved", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [[returnRequest]] = await db.query(
      `SELECT * FROM returns WHERE id = ?`,
      [id]
    );

    if (!returnRequest) {
      return res.status(404).json({ message: "Return not found" });
    }

    // If approving → calculate refund automatically
    if (status === "approved") {
      const [[item]] = await db.query(`
        SELECT quantity, price 
        FROM order_items 
        WHERE id = ?
      `, [returnRequest.order_item_id]);

      const refundAmount = item.quantity * item.price;

      await db.query(
        `UPDATE returns
         SET status = ?, refund_amount = ?
         WHERE id = ?`,
        [status, refundAmount, id]
      );
    } else {
      await db.query(
        `UPDATE returns
         SET status = ?
         WHERE id = ?`,
        [status, id]
      );
    }

    res.json({ message: `Return ${status} successfully` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const approveReturn = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE returns 
       SET status = 'approved' 
       WHERE id = ?`,
      [id]
    );

    res.json({ message: "Return approved successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error approving return" });
  }
};




export const schedulePickup = async (req, res) => {
  try {
    const { id } = req.params;

    // Call Shiprocket API here
    const shipmentId = "SR123456"; // example

    await db.query(
      `UPDATE returns 
       SET status = 'pickup_scheduled',
           shiprocket_shipment_id = ?
       WHERE id = ?`,
      [shipmentId, id]
    );
    

    res.json({ message: "Pickup scheduled" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error scheduling pickup" });
  }
};


export const shiprocketWebhook = async (req, res) => {
  try {
    const { shipment_id, current_status } = req.body;

    if (current_status === "Picked Up") {

      const [[returnRow]] = await db.query(
        `SELECT * FROM returns 
         WHERE shiprocket_shipment_id = ?`,
        [shipment_id]
      );

      if (!returnRow) return res.sendStatus(200);

      await processRefund(returnRow.id);

      await db.query(
        `UPDATE returns 
         SET status = 'refunded',
             refunded_at = NOW()
         WHERE id = ?`,
        [returnRow.id]
      );
    }

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};


export const processRefund = async (returnId) => {

  const [[returnRow]] = await db.query(
    `SELECT * FROM returns WHERE id = ?`,
    [returnId]
  );

  const [[order]] = await db.query(
    `SELECT payment_id FROM orders WHERE id = ?`,
    [returnRow.order_id]
  );

  const [[item]] = await db.query(
    `SELECT quantity, price FROM order_items WHERE id = ?`,
    [returnRow.order_item_id]
  );

  const refundAmount = item.quantity * item.price;

  const refund = await razorpay.payments.refund(order.payment_id, {
    amount: refundAmount * 100
  });

  await db.query(
    `UPDATE returns 
     SET refund_amount = ?, 
         status = 'refunded'
     WHERE id = ?`,
    [refundAmount, returnId]
  );

  return refund;
};




