// import express from 'express';
// import bcrypt from 'bcrypt';
// import { db } from '../config/db.js';
// import { protect } from '../middlewares/auth.middleware.js';
// import { superAdminOnly } from '../middlewares/role.middleware.js';
// import { myOrders } from '../controllers/adminOrder.controller.js';

// const router = express.Router();

// // Create Admin (Super Admin only)
// router.post('/create', protect, superAdminOnly, async (req, res) => {
//   const { name, email, password, role } = req.body;
//   const hash = await bcrypt.hash(password, 10);

//   await db.query(
//     'INSERT INTO admins(name,email,password,role) VALUES (?,?,?,?)',
//     [name, email, hash, role || 'admin']
//   );

//   res.json({ message: 'Admin created' });
// });

// // Enable / Disable Admin
// router.put('/status/:id', protect, superAdminOnly, async (req, res) => {
//   await db.query(
//     'UPDATE admins SET status=? WHERE id=?',
//     [req.body.status, req.params.id]
//   );
//   res.json({ message: 'Status updated' });
// });

// //admin list

// router.get('/list', protect, superAdminOnly, async (req, res) => {
//   const [rows] = await db.query(
//     'SELECT id, name, email, role, status FROM admins where role = "admin"'
//   );
//   res.json(rows);
// });


// // admin orders





// export default router;


// import express from 'express';
// import {
//   createAdmin,
//   getAdmins,
//   updateAdminStatus,
//   deleteAdmin
// } from '../controllers/admin.controller.js';

// import { protect, superAdminOnly } from '../middleware/auth.js';

// const router = express.Router();

// router.post('/create', protect, superAdminOnly, createAdmin);
// router.get('/list', protect, superAdminOnly, getAdmins);
// router.put('/status/:id', protect, superAdminOnly, updateAdminStatus);
// router.delete('/:id', protect, superAdminOnly, deleteAdmin);

// export default router;

import express from 'express';
import {
  createAdmin,
  getAdmins,
  updateAdminStatus,
  deleteAdmin,
  updateAdmin,
  getAdminDashboard,
  getAssignedOrders,
  updateOrderStatus,
  getOrderDetails,
  updateReturnStatus,getAllReturnRequests,approveReturn,schedulePickup,shiprocketWebhook,processRefund
} from '../controllers/admin.controller.js';

import { protect } from '../middlewares/auth.middleware.js';
import { superAdminOnly } from '../middlewares/role.middleware.js';
import { shipOrder } from '../controllers/admin.controller.js';

const router = express.Router();


//Admin

// router.get('/my-orders', protect, myOrders);

//Super Admin

router.post('/create', protect, superAdminOnly, createAdmin);
router.get('/', protect, superAdminOnly, getAdmins);
router.put('/status/:id', protect, superAdminOnly, updateAdminStatus);
router.delete('/:id', protect, superAdminOnly, deleteAdmin);
// router.put("/password/:id", superAdminOnly, updateAdminPassword);
router.put("/update/:id",protect, superAdminOnly, updateAdmin);

//Admin Routes

router.get("/dashboard", protect, getAdminDashboard);
router.get("/orders", protect, getAssignedOrders);
router.put("/orders/:id/status", protect, updateOrderStatus);

// router.get("/dashboard", verifyToken, isAdmin, getAdminDashboard);
// router.get("/orders", verifyToken, isAdmin, getAssignedOrders);
router.get("/orders/:id/items", protect, getOrderDetails);
// router.put("/orders/:id/status", verifyToken, isAdmin, updateOrderStatus);
// router.get("/orders/:id/items", protect, adminOnly, getOrderDetails);
router.post("/orders/:id/ship", protect, shipOrder);


router.get("/returns", getAllReturnRequests);
router.put("/returns/:id", updateReturnStatus);

router.put("/returns/:id/approve", approveReturn);
router.put("/returns/:id/schedule", schedulePickup);
router.post("/shiprocket/webhook", shiprocketWebhook);


//testing routes

router.post("/returns/:id/simulate-pickup", async (req, res) => {
  try {
    const { id } = req.params;

    await processRefund(id);

    await db.query(
      `UPDATE returns 
       SET status = 'refunded',
           refunded_at = NOW()
       WHERE id = ?`,
      [id]
    );

    res.json({ message: "Simulated pickup + refund success" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Simulation failed" });
  }
});





export default router;

