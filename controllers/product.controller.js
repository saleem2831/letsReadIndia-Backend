// import { db } from '../config/db.js';
// import { uploadToS3 } from '../services/s3Upload.service.js';

// const normalizeHsn = (value) => String(value ?? "").trim().replace(/\s+/g, "");


// // =====================================================
// // CREATE PRODUCT
// // =====================================================
// export const createProduct = async (req, res) => {
//   try {
//     const { name, description, price, stock, weight_kg, length_cm, breadth_cm, height_cm, hsn_code } = req.body;
//     const normalizedHsn = normalizeHsn(hsn_code);

//     if (!name || !price || !stock) {
//       return res.status(400).json({
//         message: "Missing required fields",
//       });
//     }
//     if (normalizedHsn && !/^\d{1,15}$/.test(normalizedHsn)) {
//       return res.status(400).json({ message: "HSN code must contain only 1 to 15 digits" });
//     }

//     // Insert product
//     const [product] = await db.query(
//       `INSERT INTO products 
//        (name, description, price, stock, status, weight_kg, length_cm, breadth_cm, height_cm, hsn_code)
//        VALUES (?,?,?,?,?,?,?,?,?,?)`,
//       [name, description, price, stock, "active", weight_kg || .5, length_cm || 20, breadth_cm || 15, height_cm || 5, normalizedHsn || null]
//     );

//     const productId = product.insertId;

//     // Upload images to S3 and store URLs
//     if (req.files && req.files.length > 0) {
//       for (let i = 0; i < req.files.length; i++) {

//         // 👇 THIS IS IMPORTANT
//         const imageUrl = await uploadToS3(req.files[i]);

//         await db.query(
//           `INSERT INTO product_images 
//            (product_id, image_url, is_primary)
//            VALUES (?,?,?)`,
//           [productId, imageUrl, i === 0 ? 1 : 0]
//         );
//       }
//     }

//     res.json({ message: "Product created successfully" });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Product creation failed",
//     });
//   }
// };




// export const getProducts = async (req, res) => {
//   const [products] = await db.query(
//     "SELECT * FROM products WHERE status='active'"
//   );

//   for (const product of products) {
//     const [images] = await db.query(
//       "SELECT image_url, is_primary FROM product_images WHERE product_id=?",
//       [product.id]
//     );

//     product.images = images;
//     product.primary_image = images.find(i => i.is_primary)?.image_url || null;
//   }

//   res.json(products);
// };


// // export const getProductById = async (req, res) => {
// //   const { id } = req.params;

// //   const [products] = await db.query(
// //     "SELECT * FROM products WHERE id = ? AND status = 'active'",
// //     [id]
// //   );

// //   if (products.length === 0) {
// //     return res.status(404).json({ message: "Product not found" });
// //   }

// //   const baseUrl = `${req.protocol}://${req.get('host')}`;
// //   const product = products[0];

// //   res.json({
// //     ...product,
// //     image: product.image ? `${baseUrl}/uploads/${product.image}` : null
// //   });
// // };

// export const getProductById = async (req, res) => {
//   const productId = req.params.id;

//   const [[product]] = await db.query(
//     "SELECT * FROM products WHERE id=? AND status='active'",
//     [productId]
//   );

//   if (!product) {
//     return res.status(404).json({ message: 'Product not found' });
//   }

//   const [images] = await db.query(
//     'SELECT image_url, is_primary FROM product_images WHERE product_id=?',
//     [productId]
//   );

//   product.images = images;
//   product.primary_image =
//     images.find(i => i.is_primary)?.image_url || null;

//   res.json(product);
// };

// // =====================================================
// // ADMIN LIST WITH PAGINATION (MATCHES YOUR FRONTEND)
// // =====================================================
// export const getProductsAdmin = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = 10;
//     const offset = (page - 1) * limit;

//     const [products] = await db.query(
//       `
//       SELECT 
//         p.*,
//         COALESCE(
//           JSON_ARRAYAGG(pi.image_url),
//           JSON_ARRAY()
//         ) AS images
//       FROM products p
//       LEFT JOIN product_images pi 
//         ON p.id = pi.product_id
//       GROUP BY p.id
//       ORDER BY p.created_at DESC
//       LIMIT ? OFFSET ?
//       `,
//       [limit, offset]
//     );

//     res.json({ data: products });

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };



// // UPDATE
// // export const updateProduct = async (req, res) => {
// //   const { name, description, price, stock, status } = req.body;
// //   const image = req.file?.filename;

// //   let query = `UPDATE products SET name=?, description=?, price=?, stock=?, status=?`;
// //   let params = [name, description, price, stock, status];

// //   if (image) {
// //     query += `, image=?`;
// //     params.push(image);
// //   }

// //   query += ` WHERE id=?`;
// //   params.push(req.params.id);

// //   await db.query(query, params);
// //   res.json({ message: 'Product updated successfully' });
// // };

// // export const updateProduct = async (req, res) => {
// //   const { name, description, price, stock, status } = req.body;
// //   const image = req.file?.filename;

// //   const fields = [];
// //   const values = [];

// //   if (name !== undefined) { fields.push('name=?'); values.push(name); }
// //   if (description !== undefined) { fields.push('description=?'); values.push(description); }
// //   if (price !== undefined) { fields.push('price=?'); values.push(price); }
// //   if (stock !== undefined) { fields.push('stock=?'); values.push(stock); }
// //   if (status !== undefined) { fields.push('status=?'); values.push(status); }
// //   if (image) { fields.push('image=?'); values.push(image); }

// //   values.push(req.params.id);

// //   await db.query(
// //     `UPDATE products SET ${fields.join(', ')} WHERE id=?`,
// //     values
// //   );

// //   res.json({ message: 'Product updated successfully' });
// // };

// // export const updateProduct = async (req, res) => {
// //   const { name, description, price, stock, status } = req.body;
// //   const image = req.file ? req.file.filename : undefined;

// //   const fields = [];
// //   const values = [];

// //   if (name !== undefined) { fields.push('name=?'); values.push(name); }
// //   if (description !== undefined) { fields.push('description=?'); values.push(description); }
// //   if (price !== undefined) { fields.push('price=?'); values.push(price); }
// //   if (stock !== undefined) { fields.push('stock=?'); values.push(stock); }
// //   if (status !== undefined) { fields.push('status=?'); values.push(status); }
// //   if (image !== undefined) { fields.push('image=?'); values.push(image); }

// //   values.push(req.params.id);

// //   await db.query(
// //     `UPDATE products SET ${fields.join(', ')} WHERE id=?`,
// //     values
// //   );

// //   res.json({ message: 'Product updated successfully' });
// // };

// // =====================================================
// // UPDATE PRODUCT
// // =====================================================
// // export const updateProduct = async (req, res) => {
// //   try {
// //     const { name, description, price, stock } = req.body;
// //     const productId = req.params.id;

// //     await db.query(
// //       `UPDATE products 
// //        SET name=?, description=?, price=?, stock=? 
// //        WHERE id=?`,
// //       [name, description, price, stock, productId]
// //     );

// //     if (req.files && req.files.length > 0) {

// //       // Delete old images
// //       await db.query(
// //         `DELETE FROM product_images WHERE product_id=?`,
// //         [productId]
// //       );

// //       // Upload new images
// //       for (let i = 0; i < req.files.length; i++) {

// //         const imageUrl = await uploadToS3(req.files[i]);

// //         await db.query(
// //           `INSERT INTO product_images 
// //            (product_id, image_url, is_primary)
// //            VALUES (?,?,?)`,
// //           [productId, imageUrl, i === 0 ? 1 : 0]
// //         );
// //       }
// //     }

// //     res.json({ message: "Product updated successfully" });

// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({
// //       message: "Product update failed",
// //     });
// //   }
// // };


// export const updateProduct = async (req, res) => {
//   try {
//     const { name, description, price, stock, existingImages, weight_kg, length_cm, breadth_cm, height_cm, hsn_code } = req.body;
//     const productId = req.params.id;
//     const normalizedHsn = normalizeHsn(hsn_code);
//     if (normalizedHsn && !/^\d{1,15}$/.test(normalizedHsn)) {
//       return res.status(400).json({ message: "HSN code must contain only 1 to 15 digits" });
//     }

//     // --------------------------------------------------
//     // 1. Update basic product information
//     // --------------------------------------------------
//     await db.query(
//       `UPDATE products
//        SET name=?, description=?, price=?, stock=?, weight_kg=?, length_cm=?, breadth_cm=?, height_cm=?, hsn_code=?
//        WHERE id=?`,
//       [name, description, price, stock, weight_kg || .5, length_cm || 20, breadth_cm || 15, height_cm || 5, normalizedHsn || null, productId]
//     );

//     // --------------------------------------------------
//     // 2. Parse existing images coming from frontend
//     // --------------------------------------------------
//     let keptImages = [];

//     if (existingImages) {
//       try {
//         keptImages = JSON.parse(existingImages);

//         if (!Array.isArray(keptImages)) {
//           keptImages = [];
//         }
//       } catch (error) {
//         console.error("Invalid existingImages JSON:", error);
//         keptImages = [];
//       }
//     }

//     // --------------------------------------------------
//     // 3. Get currently stored images from database
//     // --------------------------------------------------
//     const [currentImages] = await db.query(
//       `SELECT id, image_url, is_primary
//        FROM product_images
//        WHERE product_id=?
//        ORDER BY id ASC`,
//       [productId]
//     );

//     // --------------------------------------------------
//     // 4. Find which old images were removed
//     // --------------------------------------------------
//     const keptImageUrls = new Set(
//       keptImages.map((image) => {
//         if (typeof image === "string") {
//           return image;
//         }

//         return image?.image_url || image?.url || image?.path || "";
//       })
//     );

//     const imagesToDelete = currentImages.filter(
//       (image) => !keptImageUrls.has(image.image_url)
//     );

//     // --------------------------------------------------
//     // 5. Delete removed images from product_images
//     // --------------------------------------------------
//     for (const image of imagesToDelete) {
//       await db.query(
//         `DELETE FROM product_images
//          WHERE id=? AND product_id=?`,
//         [image.id, productId]
//       );

//       // IMPORTANT:
//       // If you also want to physically delete the image
//       // from S3, we can add that here.
//     }

//     // --------------------------------------------------
//     // 6. Upload newly added images
//     // --------------------------------------------------
//     const newUploadedImages = [];

//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const imageUrl = await uploadToS3(file);

//         newUploadedImages.push(imageUrl);
//       }
//     }

//     // --------------------------------------------------
//     // 7. Insert new images into product_images
//     // --------------------------------------------------
//     for (const imageUrl of newUploadedImages) {
//       await db.query(
//         `INSERT INTO product_images
//          (product_id, image_url, is_primary)
//          VALUES (?, ?, ?)`,
//         [
//           productId,
//           imageUrl,
//           0
//         ]
//       );
//     }

//     // --------------------------------------------------
//     // 8. Make sure there is a primary image
//     // --------------------------------------------------
//     const [finalImages] = await db.query(
//       `SELECT id
//        FROM product_images
//        WHERE product_id=?
//        ORDER BY id ASC`,
//       [productId]
//     );

//     if (finalImages.length > 0) {
//       await db.query(
//         `UPDATE product_images
//          SET is_primary=0
//          WHERE product_id=?`,
//         [productId]
//       );

//       await db.query(
//         `UPDATE product_images
//          SET is_primary=1
//          WHERE id=?`,
//         [finalImages[0].id]
//       );
//     }

//     // --------------------------------------------------
//     // 9. Success
//     // --------------------------------------------------
//     res.json({
//       message: "Product updated successfully",
//     });

//   } catch (error) {
//     console.error("UPDATE PRODUCT ERROR:", error);

//     res.status(500).json({
//       message: "Product update failed",
//       error: error.message,
//     });
//   }
// };






// // DELETE

// // export const deleteProduct = async (req, res) => {
// //   await db.query('DELETE FROM products WHERE id=?', [req.params.id]);
// //   res.json({ message: 'Product deleted permanently' });
// // };

// // =====================================================
// // DELETE PRODUCT
// // =====================================================
// export const deleteProduct = async (req, res) => {
//   try {
//     const productId = req.params.id;

//     await db.query(
//       `DELETE FROM product_images WHERE product_id=?`,
//       [productId]
//     );

//     await db.query(
//       `DELETE FROM products WHERE id=?`,
//       [productId]
//     );

//     res.json({ message: "Product deleted successfully" });

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };



// // export const updateProductStatus = async (req, res) => {
// //   const { status } = req.body;

// //   await db.query(
// //     'UPDATE products SET status=? WHERE id=?',
// //     [status, req.params.id]
// //   );

// //   res.json({ message: 'Product status updated' });
// // };

// // =====================================================
// // UPDATE PRODUCT STATUS
// // =====================================================
// export const updateProductStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     const productId = req.params.id;

//     await db.query(
//       `UPDATE products SET status=? WHERE id=?`,
//       [status, productId]
//     );

//     res.json({ message: "Status updated successfully" });

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// export const getAllProductsAdmin = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = 6;
//   const offset = (page - 1) * limit;

//   const [products] = await db.query(
//     `SELECT * FROM products
//      ORDER BY id DESC
//      LIMIT ? OFFSET ?`,
//     [limit, offset]
//   );

//   const [[{ count }]] = await db.query(
//     `SELECT COUNT(*) as count FROM products`
//   );

//   res.json({
//     data: products,
//     total: count,
//     page,
//     pages: Math.ceil(count / limit)
//   });
// };


import { db } from '../config/db.js';
import { uploadToS3 } from '../services/s3Upload.service.js';



// =====================================================
// CREATE PRODUCT
// =====================================================
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, weight_kg, length_cm, breadth_cm, height_cm, hsn_code } = req.body;

    if (!name || !price || !stock) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // Insert product
    const [product] = await db.query(
      `INSERT INTO products 
       (name, description, price, stock, status, weight_kg, length_cm, breadth_cm, height_cm, hsn_code)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [name, description, price, stock, "active", weight_kg || .5, length_cm || 20, breadth_cm || 15, height_cm || 5, hsn_code || null]
    );

    const productId = product.insertId;

    // Upload images to S3 and store URLs
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {

        // 👇 THIS IS IMPORTANT
        const imageUrl = await uploadToS3(req.files[i]);

        await db.query(
          `INSERT INTO product_images 
           (product_id, image_url, is_primary)
           VALUES (?,?,?)`,
          [productId, imageUrl, i === 0 ? 1 : 0]
        );
      }
    }

    res.json({ message: "Product created successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Product creation failed",
    });
  }
};




export const getProducts = async (req, res) => {
  const [products] = await db.query(
    "SELECT * FROM products WHERE status='active'"
  );

  for (const product of products) {
    const [images] = await db.query(
      "SELECT image_url, is_primary FROM product_images WHERE product_id=?",
      [product.id]
    );

    product.images = images;
    product.primary_image = images.find(i => i.is_primary)?.image_url || null;
  }

  res.json(products);
};


// export const getProductById = async (req, res) => {
//   const { id } = req.params;

//   const [products] = await db.query(
//     "SELECT * FROM products WHERE id = ? AND status = 'active'",
//     [id]
//   );

//   if (products.length === 0) {
//     return res.status(404).json({ message: "Product not found" });
//   }

//   const baseUrl = `${req.protocol}://${req.get('host')}`;
//   const product = products[0];

//   res.json({
//     ...product,
//     image: product.image ? `${baseUrl}/uploads/${product.image}` : null
//   });
// };

export const getProductById = async (req, res) => {
  const productId = req.params.id;

  const [[product]] = await db.query(
    "SELECT * FROM products WHERE id=? AND status='active'",
    [productId]
  );

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const [images] = await db.query(
    'SELECT image_url, is_primary FROM product_images WHERE product_id=?',
    [productId]
  );

  product.images = images;
  product.primary_image =
    images.find(i => i.is_primary)?.image_url || null;

  res.json(product);
};

// =====================================================
// ADMIN LIST WITH PAGINATION (MATCHES YOUR FRONTEND)
// =====================================================
export const getProductsAdmin = async (req, res) => {
  try {
    const requestedPage = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const [[countResult]] = await db.query(
      "SELECT COUNT(*) AS total FROM products"
    );

    const total = Number(countResult.total) || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * limit;

    const [products] = await db.query(
      `
      SELECT 
        p.*,
        COALESCE(
          JSON_ARRAYAGG(pi.image_url),
          JSON_ARRAY()
        ) AS images
      FROM products p
      LEFT JOIN product_images pi 
        ON p.id = pi.product_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    res.json({
      data: products,
      total,
      page,
      limit,
      pages: totalPages,
      totalPages,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        totalPages,
      },
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};



// UPDATE
// export const updateProduct = async (req, res) => {
//   const { name, description, price, stock, status } = req.body;
//   const image = req.file?.filename;

//   let query = `UPDATE products SET name=?, description=?, price=?, stock=?, status=?`;
//   let params = [name, description, price, stock, status];

//   if (image) {
//     query += `, image=?`;
//     params.push(image);
//   }

//   query += ` WHERE id=?`;
//   params.push(req.params.id);

//   await db.query(query, params);
//   res.json({ message: 'Product updated successfully' });
// };

// export const updateProduct = async (req, res) => {
//   const { name, description, price, stock, status } = req.body;
//   const image = req.file?.filename;

//   const fields = [];
//   const values = [];

//   if (name !== undefined) { fields.push('name=?'); values.push(name); }
//   if (description !== undefined) { fields.push('description=?'); values.push(description); }
//   if (price !== undefined) { fields.push('price=?'); values.push(price); }
//   if (stock !== undefined) { fields.push('stock=?'); values.push(stock); }
//   if (status !== undefined) { fields.push('status=?'); values.push(status); }
//   if (image) { fields.push('image=?'); values.push(image); }

//   values.push(req.params.id);

//   await db.query(
//     `UPDATE products SET ${fields.join(', ')} WHERE id=?`,
//     values
//   );

//   res.json({ message: 'Product updated successfully' });
// };

// export const updateProduct = async (req, res) => {
//   const { name, description, price, stock, status } = req.body;
//   const image = req.file ? req.file.filename : undefined;

//   const fields = [];
//   const values = [];

//   if (name !== undefined) { fields.push('name=?'); values.push(name); }
//   if (description !== undefined) { fields.push('description=?'); values.push(description); }
//   if (price !== undefined) { fields.push('price=?'); values.push(price); }
//   if (stock !== undefined) { fields.push('stock=?'); values.push(stock); }
//   if (status !== undefined) { fields.push('status=?'); values.push(status); }
//   if (image !== undefined) { fields.push('image=?'); values.push(image); }

//   values.push(req.params.id);

//   await db.query(
//     `UPDATE products SET ${fields.join(', ')} WHERE id=?`,
//     values
//   );

//   res.json({ message: 'Product updated successfully' });
// };

// =====================================================
// UPDATE PRODUCT
// =====================================================
// export const updateProduct = async (req, res) => {
//   try {
//     const { name, description, price, stock } = req.body;
//     const productId = req.params.id;

//     await db.query(
//       `UPDATE products 
//        SET name=?, description=?, price=?, stock=? 
//        WHERE id=?`,
//       [name, description, price, stock, productId]
//     );

//     if (req.files && req.files.length > 0) {

//       // Delete old images
//       await db.query(
//         `DELETE FROM product_images WHERE product_id=?`,
//         [productId]
//       );

//       // Upload new images
//       for (let i = 0; i < req.files.length; i++) {

//         const imageUrl = await uploadToS3(req.files[i]);

//         await db.query(
//           `INSERT INTO product_images 
//            (product_id, image_url, is_primary)
//            VALUES (?,?,?)`,
//           [productId, imageUrl, i === 0 ? 1 : 0]
//         );
//       }
//     }

//     res.json({ message: "Product updated successfully" });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Product update failed",
//     });
//   }
// };


export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock, existingImages, weight_kg, length_cm, breadth_cm, height_cm, hsn_code } = req.body;
    const productId = req.params.id;

    // --------------------------------------------------
    // 1. Update basic product information
    // --------------------------------------------------
    await db.query(
      `UPDATE products
       SET name=?, description=?, price=?, stock=?, weight_kg=?, length_cm=?, breadth_cm=?, height_cm=?, hsn_code=?
       WHERE id=?`,
      [name, description, price, stock, weight_kg || .5, length_cm || 20, breadth_cm || 15, height_cm || 5, hsn_code || null, productId]
    );

    // --------------------------------------------------
    // 2. Parse existing images coming from frontend
    // --------------------------------------------------
    let keptImages = [];

    if (existingImages) {
      try {
        keptImages = JSON.parse(existingImages);

        if (!Array.isArray(keptImages)) {
          keptImages = [];
        }
      } catch (error) {
        console.error("Invalid existingImages JSON:", error);
        keptImages = [];
      }
    }

    // --------------------------------------------------
    // 3. Get currently stored images from database
    // --------------------------------------------------
    const [currentImages] = await db.query(
      `SELECT id, image_url, is_primary
       FROM product_images
       WHERE product_id=?
       ORDER BY id ASC`,
      [productId]
    );

    // --------------------------------------------------
    // 4. Find which old images were removed
    // --------------------------------------------------
    const keptImageUrls = new Set(
      keptImages.map((image) => {
        if (typeof image === "string") {
          return image;
        }

        return image?.image_url || image?.url || image?.path || "";
      })
    );

    const imagesToDelete = currentImages.filter(
      (image) => !keptImageUrls.has(image.image_url)
    );

    // --------------------------------------------------
    // 5. Delete removed images from product_images
    // --------------------------------------------------
    for (const image of imagesToDelete) {
      await db.query(
        `DELETE FROM product_images
         WHERE id=? AND product_id=?`,
        [image.id, productId]
      );

      // IMPORTANT:
      // If you also want to physically delete the image
      // from S3, we can add that here.
    }

    // --------------------------------------------------
    // 6. Upload newly added images
    // --------------------------------------------------
    const newUploadedImages = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await uploadToS3(file);

        newUploadedImages.push(imageUrl);
      }
    }

    // --------------------------------------------------
    // 7. Insert new images into product_images
    // --------------------------------------------------
    for (const imageUrl of newUploadedImages) {
      await db.query(
        `INSERT INTO product_images
         (product_id, image_url, is_primary)
         VALUES (?, ?, ?)`,
        [
          productId,
          imageUrl,
          0
        ]
      );
    }

    // --------------------------------------------------
    // 8. Make sure there is a primary image
    // --------------------------------------------------
    const [finalImages] = await db.query(
      `SELECT id
       FROM product_images
       WHERE product_id=?
       ORDER BY id ASC`,
      [productId]
    );

    if (finalImages.length > 0) {
      await db.query(
        `UPDATE product_images
         SET is_primary=0
         WHERE product_id=?`,
        [productId]
      );

      await db.query(
        `UPDATE product_images
         SET is_primary=1
         WHERE id=?`,
        [finalImages[0].id]
      );
    }

    // --------------------------------------------------
    // 9. Success
    // --------------------------------------------------
    res.json({
      message: "Product updated successfully",
    });

  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    res.status(500).json({
      message: "Product update failed",
      error: error.message,
    });
  }
};






// DELETE

// export const deleteProduct = async (req, res) => {
//   await db.query('DELETE FROM products WHERE id=?', [req.params.id]);
//   res.json({ message: 'Product deleted permanently' });
// };

// =====================================================
// DELETE PRODUCT
// =====================================================
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    await db.query(
      `DELETE FROM product_images WHERE product_id=?`,
      [productId]
    );

    await db.query(
      `DELETE FROM products WHERE id=?`,
      [productId]
    );

    res.json({ message: "Product deleted successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};



// export const updateProductStatus = async (req, res) => {
//   const { status } = req.body;

//   await db.query(
//     'UPDATE products SET status=? WHERE id=?',
//     [status, req.params.id]
//   );

//   res.json({ message: 'Product status updated' });
// };

// =====================================================
// UPDATE PRODUCT STATUS
// =====================================================
export const updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const productId = req.params.id;

    await db.query(
      `UPDATE products SET status=? WHERE id=?`,
      [status, productId]
    );

    res.json({ message: "Status updated successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAllProductsAdmin = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const offset = (page - 1) * limit;

  const [products] = await db.query(
    `SELECT * FROM products
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) as count FROM products`
  );

  res.json({
    data: products,
    total: count,
    page,
    pages: Math.ceil(count / limit)
  });
};
