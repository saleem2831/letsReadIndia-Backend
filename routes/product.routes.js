// import express from 'express';
// import {
//   createProduct,
//   getProducts,
//   getProductById,
//   updateProduct,
//   deleteProduct
// } from '../controllers/product.controller.js';

// import { protect } from '../middlewares/auth.middleware.js';
// import { upload } from '../middlewares/upload.middleware.js';

// const router = express.Router();

// // Public
// router.get('/', getProducts);
// router.get("/:id", getProductById); // single product


// // Admin
// //router.post('/', protect, createProduct);
// // router.post('/', protect, upload.single('image'), createProduct);
// router.post('/',
//   protect,
//   upload.array('images', 5),
//   createProduct
// );
// router.put('/:id', protect, upload.single('image'), updateProduct);
// router.delete('/:id', protect, deleteProduct);

// export default router;

 import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getAllProductsAdmin
} from '../controllers/product.controller.js';

import { protect } from '../middlewares/auth.middleware.js';
import { superAdminOnly } from '../middlewares/role.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

import { getProductsAdmin } from '../controllers/product.controller.js';

const router = express.Router();


/* PUBLIC */
router.get('/', getProducts);
router.get('/:id', getProductById);

/* SUPER ADMIN */
// router.get('/admin/list', protect, superAdminOnly, getAllProductsAdmin);

// router.post('/', protect, superAdminOnly, upload.array('images', 5), createProduct);
// router.put('/:id', protect, superAdminOnly, upload.single('image'), updateProduct);
// router.put(
//   "/:id",
//   protect,
//   superAdminOnly,
//   upload.array("images", 5),
//   updateProduct
// );


// router.put('/status/:id', protect, superAdminOnly, updateProductStatus);
// router.delete('/:id', protect, superAdminOnly, deleteProduct);




// =============================================
// ADMIN LIST (SUPER ADMIN ONLY)
// =============================================
router.get(
  "/admin/list",
  protect,
  superAdminOnly,
  getProductsAdmin
);


// =============================================
// CREATE PRODUCT (MAX 5 IMAGES)
// =============================================
router.post(
  "/",
  protect,
  superAdminOnly,
  upload.array("images", 5),
  createProduct
);


// =============================================
// UPDATE PRODUCT
// =============================================
router.put(
  "/:id",
  protect,
  superAdminOnly,
  upload.array("images", 5),
  updateProduct
);


// =============================================
// UPDATE STATUS
// =============================================
router.put(
  "/status/:id",
  protect,
  superAdminOnly,
  updateProductStatus
);


// =============================================
// DELETE PRODUCT
// =============================================
router.delete(
  "/:id",
  protect,
  superAdminOnly,
  deleteProduct
);

export default router;

