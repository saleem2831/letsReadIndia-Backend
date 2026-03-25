import { db } from '../config/db.js';

export const myOrders = async (req, res) => {
  const adminId = req.user.id;

  const [orders] = await db.query(
    `SELECT o.*
     FROM orders o
     JOIN order_assignments a ON a.order_id = o.id
     WHERE a.admin_id = ?`,
    [adminId]
  );

  res.json(orders);
};
