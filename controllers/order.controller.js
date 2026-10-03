// import crypto from "node:crypto";
// import { db } from "../config/db.js";
// import { assignOrderToAdmin } from "../utils/assignAdmin.js";
// import { sendOrderEmail } from "../services/email.service.js";
// import { notifyOrderChanged } from "../utils/realtime.js";

// export const placeOrder = async (req, res) => {
//   let connection;
//   try {
//     const { payment_id: paymentId, order_id: razorpayOrderId, signature } = req.body;
//     if (!paymentId || !razorpayOrderId || !signature) return res.status(400).json({ message: "Payment is not verified" });
//     const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(`${razorpayOrderId}|${paymentId}`).digest("hex");
//     const supplied = Buffer.from(signature, "utf8");
//     const expectedBuffer = Buffer.from(expected, "utf8");
//     if (supplied.length !== expectedBuffer.length || !crypto.timingSafeEqual(supplied, expectedBuffer)) {
//       return res.status(400).json({ message: "Invalid payment signature" });
//     }

//     const [[existingOrder]] = await db.query(
//       "SELECT order_number FROM orders WHERE razorpay_order_id=? OR payment_id=? LIMIT 1",
//       [razorpayOrderId, paymentId],
//     );
//     if (existingOrder) {
//       return res.json({ message: "Order already placed", order_number: existingOrder.order_number, duplicate: true });
//     }

//     connection = await db.getConnection();
//     await connection.beginTransaction();
//     const [[quote]] = await connection.query(
//       `SELECT * FROM checkout_quotes WHERE razorpay_order_id=? AND status='payment_created' FOR UPDATE`,
//       [razorpayOrderId],
//     );
//     if (!quote) throw new Error("Payment quote is missing or already used");
//     const customer = typeof quote.customer_json === "string" ? JSON.parse(quote.customer_json) : quote.customer_json;
//     const items = typeof quote.items_json === "string" ? JSON.parse(quote.items_json) : quote.items_json;
//     if (!customer || !Array.isArray(items) || !items.length) throw new Error("Payment quote data is invalid");
//     for (const item of items) {
//       const [[product]] = await connection.query("SELECT stock,price FROM products WHERE id=? FOR UPDATE", [item.product_id]);
//       if (!product || product.stock < item.quantity || Number(product.price) !== Number(item.price)) {
//         throw new Error(`Stock or price changed for ${item.name}. Please start checkout again.`);
//       }
//     }
//     if (quote.coupon_id) {
//       const [[usage]] = await connection.query(
//         `SELECT c.maximum_uses,c.uses_per_email,
//          (SELECT COUNT(*) FROM coupon_redemptions WHERE coupon_id=c.id) total_uses,
//          (SELECT COUNT(*) FROM coupon_redemptions WHERE coupon_id=c.id AND customer_email=?) email_uses
//          FROM coupons c WHERE c.id=? FOR UPDATE`, [customer.email, quote.coupon_id],
//       );
//       if (!usage || (usage.maximum_uses !== null && usage.total_uses >= usage.maximum_uses)
//           || (usage.uses_per_email !== null && usage.email_uses >= usage.uses_per_email)) {
//         throw new Error("Coupon usage limit was reached. Please start checkout again.");
//       }
//     }

//     const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
//     const shippingQuoteJson = quote.shipping_rate_json == null
//       ? null
//       : typeof quote.shipping_rate_json === "string"
//         ? quote.shipping_rate_json
//         : JSON.stringify(quote.shipping_rate_json);
//     const [insert] = await connection.query(
//       `INSERT INTO orders
//        (order_number,customer_name,email,phone,address,city,state,country,pincode,subtotal,delivery_fee,total,
//         payment_id,razorpay_order_id,payment_mode,payment_status,status,currency,discount_amount,coupon_id,coupon_code,
//         shipping_mode,quoted_courier_id,courier_name,estimated_delivery_days,shipping_quote_json,shipment_status)
//        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'online\',\'paid\',\'pending\',?,?,?,?,?,?,?,?,?,\'quoted\')`,
//       [orderNumber, customer.customer_name, customer.email, customer.phone, customer.address, customer.city,
//         customer.state, customer.country, customer.pincode, quote.subtotal, quote.shipping_fee, quote.total,
//         paymentId, razorpayOrderId, quote.currency, quote.discount_amount, quote.coupon_id, quote.coupon_code,
//         quote.shipping_mode, quote.courier_id, quote.courier_name, quote.estimated_delivery_days, shippingQuoteJson],
//     );
//     for (const item of items) {
//       await connection.query("INSERT INTO order_items (order_id,product_id,quantity,price) VALUES (?,?,?,?)",
//         [insert.insertId, item.product_id, item.quantity, item.price]);
//       await connection.query("UPDATE products SET stock=stock-? WHERE id=?", [item.quantity, item.product_id]);
//     }
//     if (quote.coupon_id) {
//       await connection.query(
//         "INSERT INTO coupon_redemptions (coupon_id,order_id,customer_email,discount_amount) VALUES (?,?,?,?)",
//         [quote.coupon_id, insert.insertId, customer.email, quote.discount_amount],
//       );
//     }
//     await connection.query("UPDATE checkout_quotes SET status='consumed' WHERE id=?", [quote.id]);
//     await connection.commit();
//     const assignedAdminId = await assignOrderToAdmin(insert.insertId)
//       .catch((error) => { console.error("ORDER ASSIGNMENT ERROR", error.message); return null; });
//     await notifyOrderChanged(insert.insertId, assignedAdminId ? "created" : "unassigned");
//     const [[order]] = await db.query("SELECT * FROM orders WHERE id=?", [insert.insertId]);
//     sendOrderEmail(order).catch((error) => console.error("ORDER EMAIL ERROR", error.message));
//     res.json({ message: "Order placed successfully", order_number: orderNumber });
//   } catch (error) {
//     if (connection) await connection.rollback().catch(() => {});
//     console.error("ORDER ERROR", error);
//     res.status(/quote|stock|price|coupon|signature|verified/i.test(error.message) ? 400 : 500)
//       .json({ message: error.message || "Order placement failed" });
//   } finally { connection?.release(); }
// };


import crypto from "node:crypto";
import { db } from "../config/db.js";
import { assignOrderToAdmin } from "../utils/assignAdmin.js";
import { sendOrderEmail } from "../services/email.service.js";
import { sendOrderConfirmationWhatsApp } from "../services/whatsapp.service.js";
import { notifyOrderChanged } from "../utils/realtime.js";

export const placeOrder = async (req, res) => {
  let connection;
  try {
    const { payment_id: paymentId, order_id: razorpayOrderId, signature } = req.body;
    if (!paymentId || !razorpayOrderId || !signature) return res.status(400).json({ message: "Payment is not verified" });
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${paymentId}`).digest("hex");
    const supplied = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (supplied.length !== expectedBuffer.length || !crypto.timingSafeEqual(supplied, expectedBuffer)) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const [[existingOrder]] = await db.query(
      "SELECT order_number FROM orders WHERE razorpay_order_id=? OR payment_id=? LIMIT 1",
      [razorpayOrderId, paymentId],
    );
    if (existingOrder) {
      return res.json({ message: "Order already placed", order_number: existingOrder.order_number, duplicate: true });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();
    const [[quote]] = await connection.query(
      `SELECT * FROM checkout_quotes WHERE razorpay_order_id=? AND status='payment_created' FOR UPDATE`,
      [razorpayOrderId],
    );
    if (!quote) throw new Error("Payment quote is missing or already used");
    const customer = typeof quote.customer_json === "string" ? JSON.parse(quote.customer_json) : quote.customer_json;
    const items = typeof quote.items_json === "string" ? JSON.parse(quote.items_json) : quote.items_json;
    if (!customer || !Array.isArray(items) || !items.length) throw new Error("Payment quote data is invalid");
    for (const item of items) {
      const [[product]] = await connection.query("SELECT stock,price FROM products WHERE id=? FOR UPDATE", [item.product_id]);
      if (!product || product.stock < item.quantity || Number(product.price) !== Number(item.price)) {
        throw new Error(`Stock or price changed for ${item.name}. Please start checkout again.`);
      }
    }
    if (quote.coupon_id) {
      const [[usage]] = await connection.query(
        `SELECT c.maximum_uses,c.uses_per_email,
         (SELECT COUNT(*) FROM coupon_redemptions WHERE coupon_id=c.id) total_uses,
         (SELECT COUNT(*) FROM coupon_redemptions WHERE coupon_id=c.id AND customer_email=?) email_uses
         FROM coupons c WHERE c.id=? FOR UPDATE`, [customer.email, quote.coupon_id],
      );
      if (!usage || (usage.maximum_uses !== null && usage.total_uses >= usage.maximum_uses)
          || (usage.uses_per_email !== null && usage.email_uses >= usage.uses_per_email)) {
        throw new Error("Coupon usage limit was reached. Please start checkout again.");
      }
    }

    const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const shippingQuoteJson = quote.shipping_rate_json == null
      ? null
      : typeof quote.shipping_rate_json === "string"
        ? quote.shipping_rate_json
        : JSON.stringify(quote.shipping_rate_json);
    const [insert] = await connection.query(
      `INSERT INTO orders
       (order_number,customer_name,email,phone,address,city,state,country,pincode,subtotal,delivery_fee,total,
        payment_id,razorpay_order_id,payment_mode,payment_status,status,currency,discount_amount,coupon_id,coupon_code,
        shipping_mode,quoted_courier_id,courier_name,estimated_delivery_days,shipping_quote_json,shipment_status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'online\',\'paid\',\'pending\',?,?,?,?,?,?,?,?,?,\'quoted\')`,
      [orderNumber, customer.customer_name, customer.email, customer.phone, customer.address, customer.city,
        customer.state, customer.country, customer.pincode, quote.subtotal, quote.shipping_fee, quote.total,
        paymentId, razorpayOrderId, quote.currency, quote.discount_amount, quote.coupon_id, quote.coupon_code,
        quote.shipping_mode, quote.courier_id, quote.courier_name, quote.estimated_delivery_days, shippingQuoteJson],
    );
    for (const item of items) {
      await connection.query("INSERT INTO order_items (order_id,product_id,quantity,price) VALUES (?,?,?,?)",
        [insert.insertId, item.product_id, item.quantity, item.price]);
      await connection.query("UPDATE products SET stock=stock-? WHERE id=?", [item.quantity, item.product_id]);
    }
    if (quote.coupon_id) {
      await connection.query(
        "INSERT INTO coupon_redemptions (coupon_id,order_id,customer_email,discount_amount) VALUES (?,?,?,?)",
        [quote.coupon_id, insert.insertId, customer.email, quote.discount_amount],
      );
    }
    await connection.query("UPDATE checkout_quotes SET status='consumed' WHERE id=?", [quote.id]);
    await connection.commit();
    const assignedAdminId = await assignOrderToAdmin(insert.insertId)
      .catch((error) => { console.error("ORDER ASSIGNMENT ERROR", error.message); return null; });
    await notifyOrderChanged(insert.insertId, assignedAdminId ? "created" : "unassigned");
    const [[order]] = await db.query("SELECT * FROM orders WHERE id=?", [insert.insertId]);
    sendOrderEmail(order).catch((error) => console.error("ORDER EMAIL ERROR", error.message));
    sendOrderConfirmationWhatsApp(order)
      .then((delivery) => console.log("ORDER WHATSAPP SENT", delivery.messageId))
      .catch((error) => console.error("ORDER WHATSAPP ERROR", error.message));
    res.json({ message: "Order placed successfully", order_number: orderNumber });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error("ORDER ERROR", error);
    res.status(/quote|stock|price|coupon|signature|verified/i.test(error.message) ? 400 : 500)
      .json({ message: error.message || "Order placement failed" });
  } finally { connection?.release(); }
};
