import { db } from '../config/db.js';

export const assignOrderToAdmin = async (orderId) => {
  const [admins] = await db.query(
    "SELECT id FROM admins WHERE role='admin' AND status='active' ORDER BY id"
  );

  if (!admins.length) return null;

  const [last] = await db.query(
    'SELECT admin_id FROM order_assignments ORDER BY id DESC LIMIT 1'
  );

  let nextIndex = 0;

  if (last.length) {
    const lastIndex = admins.findIndex(a => a.id === last[0].admin_id);
    nextIndex = (lastIndex + 1) % admins.length;
  }

  const assignedAdmin = admins[nextIndex];

  await db.query(
    'INSERT INTO order_assignments(order_id, admin_id) VALUES (?,?)',
    [orderId, assignedAdmin.id]
  );

  await db.query(
    "UPDATE orders SET status='assigned' WHERE id=?",
    [orderId]
  );

  return assignedAdmin.id;
};
