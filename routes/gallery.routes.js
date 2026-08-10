// import express from "express";

// import { protect } from "../middlewares/auth.middleware.js";
// import { superAdminOnly } from "../middlewares/role.middleware.js";
// import { upload } from "../middlewares/upload.middleware.js";

// import {

//     uploadGalleryImage,
//     getGalleryImages,
//     updateGalleryImage,
//     deleteGalleryImage,

//     addGalleryVideo,
//     getGalleryVideos,
//     updateGalleryVideo,
//     deleteGalleryVideo

// } from "../controllers/gallery.controller.js";

// const router = express.Router();

// /* Images */

// router.post(
//     "/images",
//     protect,
//     superAdminOnly,
//     upload.single("image"),
//     uploadGalleryImage
// );

// router.get(
//     "/images",
//     getGalleryImages
// );

// router.put(
//     "/images/:id",
//     protect,
//     superAdminOnly,
//     upload.single("image"),
//     updateGalleryImage
// );

// router.delete(
//     "/images/:id",
//     protect,
//     superAdminOnly,
//     deleteGalleryImage
// );

// /* Videos */

// router.post(
//     "/videos",
//     protect,
//     superAdminOnly,
//     addGalleryVideo
// );

// router.get(
//     "/videos",
//     getGalleryVideos
// );

// router.put(
//     "/videos/:id",
//     protect,
//     superAdminOnly,
//     updateGalleryVideo
// );

// router.delete(
//     "/videos/:id",
//     protect,
//     superAdminOnly,
//     deleteGalleryVideo
// );

// export default router;


import express from "express";

import { protect } from "../middlewares/auth.middleware.js";
import { superAdminOnly } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

import {
  uploadGalleryImage,
  getGalleryImages,
  updateGalleryImage,
  deleteGalleryImage,

  addGalleryVideo,
  getGalleryVideos,
  updateGalleryVideo,
  deleteGalleryVideo,
} from "../controllers/gallery.controller.js";

const router = express.Router();


/* =====================================================
   GALLERY IMAGES
===================================================== */


/* Upload Image */

router.post(
  "/images",
  protect,
  superAdminOnly,
  upload.single("image"),
  uploadGalleryImage
);


/* Get Images */

router.get(
  "/images",
  getGalleryImages
);


/* Update Image */

router.put(
  "/images/:id",
  protect,
  superAdminOnly,
  upload.single("image"),
  updateGalleryImage
);


/* Delete Image */

router.delete(
  "/images/:id",
  protect,
  superAdminOnly,
  deleteGalleryImage
);


/* =====================================================
   GALLERY VIDEOS
===================================================== */


/* Add Video */

router.post(
  "/videos",
  protect,
  superAdminOnly,
  addGalleryVideo
);


/* Get Videos */

router.get(
  "/videos",
  getGalleryVideos
);


/* Update Video */

router.put(
  "/videos/:id",
  protect,
  superAdminOnly,
  updateGalleryVideo
);


/* Delete Video */

router.delete(
  "/videos/:id",
  protect,
  superAdminOnly,
  deleteGalleryVideo
);


export default router;