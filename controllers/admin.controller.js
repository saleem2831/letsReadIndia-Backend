

import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import PDFDocument from "pdfkit";
import {
  createShiprocketOrder,
  checkServiceability,
  assignAWB,
} from "../services/shiprocket.service.js";
import razorpay from "../config/razorpay.js";



/* CREATE ADMIN */
export const createAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;

  const hash = await bcrypt.hash(password, 10);

  await db.query(
    'INSERT INTO admins(name,email,password,role,status) VALUES (?,?,?,?,?)',
    [name, email, hash, role || 'admin', 'active']
  );

  res.json({ message: 'Admin created successfully' });
};

/* GET ADMINS WITH PAGINATION */
// export const getAdmins = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = 20;
//   const offset = (page - 1) * limit;

//   const [admins] = await db.query(
//     `SELECT id, name, email, role, status
//      FROM admins
//      WHERE role='admin'
//      LIMIT ? OFFSET ?`,
//     [limit, offset]
//   );

//   const [[{ count }]] = await db.query(
//     `SELECT COUNT(*) as count FROM admins WHERE role='admin'`
//   );

//   res.json({
//     data: admins,
//     total: count,
//     page,
//     pages: Math.ceil(count / limit)
//   });
// };


export const getAdmins = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
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
// export const deleteAdmin = async (req, res) => {
//   await db.query('DELETE FROM admins WHERE id=?', [req.params.id]);
//   res.json({ message: 'Admin deleted' });
// };

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

// export const updateAdminPassword = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { password } = req.body;

//     if (!password) {
//       return res.status(400).json({ message: "Password required" });
//     }

//     const hash = await bcrypt.hash(password, 10);

//     await db.query(
//       "UPDATE admins SET password=? WHERE id=?",
//       [hash, id]
//     );

//     res.json({ message: "Password updated successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

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

// export const getAdminDashboard = async (req, res) => {
//   try {
//     const adminId = req.user.id;

//     const [[stats]] = await db.query(
//       `
//       SELECT
//         COUNT(o.id) AS total_orders,
//         SUM(o.status = 'pending') AS pending,
//         SUM(o.status = 'assigned') AS assigned,
//         SUM(o.status = 'shipped') AS shipped,
//         SUM(o.status = 'delivered') AS delivered,
//         COALESCE(SUM(o.total), 0) AS total_value,
//         COUNT(DISTINCT o.email) AS total_customers
//       FROM order_assignments oa
//       JOIN orders o ON o.id = oa.order_id
//       WHERE oa.admin_id = ?
//       `,
//       [adminId]
//     );

//     res.json(stats);
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };


// export const updateOrderStatus = async (req, res) => {
//   try {
//     const adminId = req.user.id;
//     const { id } = req.params;
//     const { status } = req.body;

//     // ensure order belongs to this admin
//     const [[exists]] = await db.query(
//       `SELECT * FROM order_assignments WHERE order_id = ? AND admin_id = ?`,
//       [id, adminId]
//     );

//     if (!exists) {
//       return res.status(403).json({ message: "Not allowed" });
//     }

//     await db.query(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);

//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };


// export const getAssignedOrders = async (req, res) => {
//   try {
//     const adminId = req.user.id;

//     const page = parseInt(req.query.page) || 1;
//     const limit = 10;
//     const offset = (page - 1) * limit;

//     const search = req.query.search || "";
//     const status = req.query.status || "";

//     const [orders] = await db.query(
//       `SELECT
//         o.*,
//         COALESCE(SUM(oi.quantity),0) AS total_quantity
//        FROM orders o
//        JOIN order_assignments oa ON oa.order_id = o.id
//        LEFT JOIN order_items oi ON oi.order_id = o.id
//        WHERE oa.admin_id = ?
//        AND (o.order_number LIKE ? OR o.customer_name LIKE ?)
//        AND (? = '' OR o.status = ?)
//        GROUP BY o.id
//        ORDER BY o.created_at DESC
//        LIMIT ? OFFSET ?`,
//       [adminId, `%${search}%`, `%${search}%`, status, status, limit, offset]
//     );

//     const [[{ count }]] = await db.query(
//       `SELECT COUNT(*) as count
//        FROM orders o
//        JOIN order_assignments oa ON oa.order_id = o.id
//        WHERE oa.admin_id = ?`,
//       [adminId]
//     );

//     res.json({
//       data: orders,
//       page,
//       pages: Math.ceil(count / limit),
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const getOrderDetails = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [items] = await db.query(
//       `SELECT
//         p.name,
//         oi.quantity,
//         oi.price
//        FROM order_items oi
//        JOIN products p ON p.id = oi.product_id
//        WHERE oi.order_id = ?`,
//       [id]
//     );

//     res.json(items);
//   } catch {
//     res.status(500).json({ message: "Server error" });
//   }
// };

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


// export const updateOrderStatus = async (req, res) => {
//   try {
//     const adminId = req.user.id;
//     const { id } = req.params;
//     const { status } = req.body;

//     const allowed = ["pending", "assigned", "shipped", "delivered"];
//     if (!allowed.includes(status)) {
//       return res.status(400).json({ message: "Invalid status" });
//     }

//     const [[exists]] = await db.query(
//       `SELECT id FROM order_assignments WHERE order_id = ? AND admin_id = ?`,
//       [id, adminId]
//     );

//     if (!exists) {
//       return res.status(403).json({ message: "Not allowed" });
//     }

//     await db.query(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);

//     res.json({ success: true });
//   } catch {
//     res.status(500).json({ message: "Server error" });
//   }
// };

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
        `UPDATE orders SET status = ? WHERE id = ?`,
        [status, id]
      );
    }

    res.json({ success: true });
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
      pages: Math.ceil(count / limit),
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

    const [items] = await db.query(
      `SELECT
        p.name,
        oi.quantity,
        oi.price
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [id]
    );

    res.json(items);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};


// export const shipOrder = async (req, res) => {
//   try {
//     const adminId = req.user.id;
//     const { id } = req.params;
//     const { weight, length, breadth, height } = req.body;

//     // Check assignment
//     const [[allowed]] = await db.query(
//       `SELECT id FROM order_assignments WHERE order_id=? AND admin_id=?`,
//       [id, adminId]
//     );

//     if (!allowed) {
//       return res.status(403).json({ message: "Not allowed" });
//     }

//     const [[order]] = await db.query(
//       `SELECT * FROM orders WHERE id=?`,
//       [id]
//     );

//     const [items] = await db.query(
//       `SELECT p.name, oi.quantity, oi.price, oi.product_id
//        FROM order_items oi
//        JOIN products p ON p.id = oi.product_id
//        WHERE oi.order_id=?`,
//       [id]
//     );

//     // 1️⃣ Create Shiprocket Order
//     const srOrder = await createShiprocketOrder(order, items, {
//       weight,
//       length,
//       breadth,
//       height,
//     });

//     const shipment_id = srOrder.shipment_id;

//     // 2️⃣ Check Serviceability
//     const service = await checkServiceability(
//       "411042",
//       order.pincode,
//       weight
//     );

//     const courier =
//       service.data.available_courier_companies.sort(
//         (a, b) => a.rate - b.rate
//       )[0];

//     // 3️⃣ Assign AWB
//     const awb = await assignAWB(shipment_id, courier.courier_company_id);

//     // 4️⃣ Update DB
//     await db.query(
//       `UPDATE orders SET 
//        waybill=?, 
//        shipment_status='created',
//        status='shipped'
//        WHERE id=?`,
//       [awb.awb_code, id]
//     );

//     res.json({ success: true, awb: awb.awb_code });
//   } catch (err) {
//     console.error("SHIP ERROR:", err.response?.data || err.message);
//     res.status(500).json({ message: "Shipping failed" });
//   }
// };


// export const shipOrder = async (req, res) => {
//   try {
//     const adminId = req.user.id;
//     const { id } = req.params;
//     const { weight, length, breadth, height } = req.body;

//     // 1️⃣ Check assignment
//     const [rows] = await db.query(
//       `SELECT * FROM order_assignments WHERE order_id=? AND admin_id=?`,
//       [id, adminId]
//     );

//     if (!rows.length) {
//       return res.status(403).json({ message: "Not allowed" });
//     }

//     // 2️⃣ Get order
//     const [[order]] = await db.query(
//       `SELECT * FROM orders WHERE id=?`,
//       [id]
//     );

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     // 3️⃣ Get items
//     const [items] = await db.query(
//       `SELECT p.name, oi.quantity, oi.price, oi.product_id
//        FROM order_items oi
//        JOIN products p ON p.id = oi.product_id
//        WHERE oi.order_id=?`,
//       [id]
//     );

//     // 4️⃣ Create Shiprocket Order
//     const srOrder = await createShiprocketOrder(order, items, {
//       weight,
//       length,
//       breadth,
//       height,
//     });

//     const shipment_id = srOrder.shipment_id;

//     if (!shipment_id) {
//       return res.status(500).json({ message: "Shipment ID not generated" });
//     }

//     // 5️⃣ Check Serviceability
//     const service = await checkServiceability(
//       "411042", // pickup pincode
//       order.pincode,
//       weight
//     );

//     const courierList = service?.data?.available_courier_companies;

//     if (!courierList || !courierList.length) {
//       return res.status(400).json({ message: "No courier available" });
//     }

//     const cheapestCourier = courierList.sort(
//       (a, b) => a.rate - b.rate
//     )[0];

//     // 6️⃣ Assign AWB
//     const awbRes = await assignAWB(
//       shipment_id,
//       cheapestCourier.courier_company_id
//     );

//     const awbCode = awbRes.awb_code;

//     if (!awbCode) {
//       return res.status(500).json({ message: "AWB not generated" });
//     }

//     // 7️⃣ Update DB
//     await db.query(
//       `UPDATE orders SET 
//        shipment_id=?,
//        waybill=?,
//        courier_name=?,
//        shipment_status='created',
//        status='shipped'
//        WHERE id=?`,
//       [
//         shipment_id,
//         awbCode,
//         cheapestCourier.courier_name,
//         id
//       ]
//     );

//     res.json({
//       success: true,
//       shipment_id,
//       awb: awbCode,
//       courier: cheapestCourier.courier_name
//     });

//   } catch (err) {
//     console.error("🔥 SHIP ERROR FULL:", err.response?.data || err);
//     res.status(500).json({
//       message: "Shipping failed",
//       error: err.response?.data || err.message
//     });
//   }
// };


export const shipOrder = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { weight, length, breadth, height } = req.body;

    // 1️⃣ Check assignment
    const [rows] = await db.query(
      `SELECT * FROM order_assignments WHERE order_id=? AND admin_id=?`,
      [id, adminId]
    );

    if (!rows.length) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // 2️⃣ Get order
    const [[order]] = await db.query(
      `SELECT * FROM orders WHERE id=?`,
      [id]
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 3️⃣ Get items
    const [items] = await db.query(
      `SELECT p.name, oi.quantity, oi.price, oi.product_id
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id=?`,
      [id]
    );

    // 4️⃣ Create Shiprocket Order
    const srOrder = await createShiprocketOrder(order, items, {
      weight,
      length,
      breadth,
      height,
    });

    console.log("SHIPROCKET ORDER RESPONSE:", srOrder);

    const shipment_id =
      srOrder?.shipment_id ||
      srOrder?.shipment_id?.[0];

    if (!shipment_id) {
      return res.status(500).json({
        message: "Shipment ID not generated",
        fullResponse: srOrder
      });
    }

    // 5️⃣ Check Serviceability
    const service = await checkServiceability(
      "411042",
      order.pincode,
      weight
    );

    const courierList = service?.data?.available_courier_companies;

    if (!courierList || !courierList.length) {
      return res.status(400).json({ message: "No courier available" });
    }

    const cheapestCourier = courierList.sort(
      (a, b) => a.rate - b.rate
    )[0];

    // 6️⃣ Assign AWB
    const awbRes = await assignAWB(
      shipment_id,
      cheapestCourier.courier_company_id
    );

    console.log("AWB RESPONSE:", awbRes);

    const awbCode = awbRes?.response?.awb_code;

    if (!awbCode) {
      return res.status(500).json({
        message: "AWB not generated",
        fullResponse: awbRes
      });
    }

    // 7️⃣ Generate Pickup
    await generatePickup(shipment_id);

    // 8️⃣ Update DB
    await db.query(
      `UPDATE orders SET 
       shipment_id=?,
       waybill=?,
       courier_name=?,
       shipment_status='created',
       status='shipped'
       WHERE id=?`,
      [
        shipment_id,
        awbCode,
        cheapestCourier.courier_name,
        id
      ]
    );

    res.json({
      success: true,
      shipment_id,
      awb: awbCode,
      courier: cheapestCourier.courier_name
    });

  } catch (err) {
    console.error("🔥 SHIP ERROR FULL:", err.response?.data || err);
    res.status(500).json({
      message: "Shipping failed",
      error: err.response?.data || err.message
    });
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




