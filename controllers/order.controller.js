
import { db } from '../config/db.js';
import { assignOrderToAdmin } from '../utils/assignAdmin.js';
import crypto from 'crypto';

// import { createDelhiveryShipment } from '../services/delhivery.service.js';
import { sendOrderEmail } from '../services/email.service.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';
import { json } from 'stream/consumers';

export const placeOrder = async (req, res) => {
  try {


    const {
  payment_id,
  order_id,
  signature,
  customer_name,
  email,
  phone,
  address,
  pincode,
  city,
  state,
  country,
  items
} = req.body;


    // 🔐 1. Razorpay Payment Verification
    if (!payment_id || !order_id || !signature) {
      return res.status(400).json({ message: 'Payment not verified' });
    }

    if (!pincode || !city || !state) {
  return res.status(400).json({ message: "Address details missing" });
}

    const body = `${order_id}|${payment_id}`;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid Razorpay signature' });
    }



    // 💰 2. Validate stock & calculate subtotal
    let subtotal = 0;

    for (const item of items) {
      const [[product]] = await db.query(
        'SELECT stock, price FROM products WHERE id=?',
        [item.product_id]
      );

      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ${item.product_id}`
        });
      }

      subtotal += product.price * item.quantity;
    }

    const delivery_fee = subtotal >= 1500 ? 0 : 100;
    const total = subtotal + delivery_fee;
    const order_number = `ORD-${Date.now()}`;



const [orderResult] = await db.query(
  `INSERT INTO orders
   (order_number, customer_name, email, phone, address,
    city, state, country, pincode,
    subtotal, delivery_fee, total,
    payment_id, razorpay_order_id,
    payment_mode, payment_status, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'online', 'paid', 'assigned')`,
  [
    order_number,
    customer_name,
    email,
    phone,
    address,
    city,
    state,
    country || "India",
    pincode,
    subtotal,
    delivery_fee,
    total,
    payment_id,
    order_id
  ]
);


    const orderId = orderResult.insertId;

    // 📦 4. Insert order items + update stock
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?,?,?,?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      await db.query(
        `UPDATE products SET stock = stock - ? WHERE id=?`,
        [item.quantity, item.product_id]
      );
    }

    // 👨‍💼 5. Assign order to admin
    await assignOrderToAdmin(orderId);

    // 🔍 Fetch full order row for services
    const [orderData] = await db.query(
      'SELECT * FROM orders WHERE id=?',
      [orderId]
    );

    const orderRow = orderData[0];

    // console.log("Order Data", json.stringify(orderRow));

(async () => {


  try {
    await sendOrderEmail(orderRow);
    // console.log('Email sent');
  } catch (err) {
    console.error('Email failed:', err.message);
  }

//   try {
//     await sendWhatsAppMessage(orderRow);
//     // console.log('WhatsApp sent',orderRow );
//   } catch (err) {
//     console.error('WhatsApp failed:', err.message);
//   }
})();



    // ✅ 9. Final response
    res.json({
      message: 'Order placed successfully',
      order_number
    });
// setImmediate(async () => {
//   try {
//     await createDelhiveryShipment(orderRow, items);
//   } catch (err) {
//     console.error("Delhivery background failed:", err.message);
//   }
// });


  } catch (err) {
    console.error('ORDER ERROR:', err);
    res.status(500).json({ message: 'Order placement failed' });
  }
};
