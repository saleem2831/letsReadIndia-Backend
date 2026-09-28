import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { db } from "../config/db.js";

let io;

const allowedOrigins = [
  "https://letsreadindia.in",
  "https://www.letsreadindia.in",
  "http://localhost:5173",
];

export const initializeRealtime = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
        || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (!token) return next(new Error("Authentication required"));
      const user = jwt.verify(token, process.env.JWT_SECRET);
      if (!user?.id || !["admin", "super_admin"].includes(user.role)) {
        return next(new Error("Access denied"));
      }
      socket.user = user;
      return next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`role:${socket.user.role}`);
    socket.join(`admin:${socket.user.id}`);
  });

  return io;
};

export const notifyOrderChanged = async (orderId, change = "updated") => {
  if (!io) return;
  try {
    const [[order]] = await db.query(
      `SELECT o.*,oa.admin_id,a.name AS assigned_admin_name,a.email AS assigned_admin_email,
              COALESCE(items.total_quantity,0) AS total_quantity
       FROM orders o
       LEFT JOIN order_assignments oa ON oa.order_id=o.id
       LEFT JOIN admins a ON a.id=oa.admin_id
       LEFT JOIN (
         SELECT order_id,SUM(quantity) AS total_quantity FROM order_items GROUP BY order_id
       ) items ON items.order_id=o.id
       WHERE o.id=? LIMIT 1`,
      [orderId],
    );
    if (!order) return;
    const payload = { change, order };
    io.to("role:super_admin").emit("orders:changed", payload);
    if (order.admin_id) io.to(`admin:${order.admin_id}`).emit("orders:changed", payload);
  } catch (error) {
    console.error("REALTIME ORDER NOTIFICATION ERROR", error.message);
  }
};
