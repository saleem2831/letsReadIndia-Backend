// import multer from 'multer';
// import path from 'path';

// const storage = multer.diskStorage({
//   destination: 'uploads/',
//   filename: (_, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });


// export const upload = multer({ storage });


import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB per image
  },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'), false);
    } else {
      cb(null, true);
    }
  }
});

