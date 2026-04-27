import { db } from '../config/db.js';
import { uploadToS3 } from '../services/s3Upload.service.js';



// =====================================================
// CREATE PRODUCT
// =====================================================
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;

    if (!name || !price || !stock) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // Insert product
    const [product] = await db.query(
      `INSERT INTO products 
       (name, description, price, stock, status)
       VALUES (?,?,?,?,?)`,
      [name, description, price, stock, "active"]
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
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
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

    res.json({ data: products });

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
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    const productId = req.params.id;

    await db.query(
      `UPDATE products 
       SET name=?, description=?, price=?, stock=? 
       WHERE id=?`,
      [name, description, price, stock, productId]
    );

    if (req.files && req.files.length > 0) {

      // Delete old images
      await db.query(
        `DELETE FROM product_images WHERE product_id=?`,
        [productId]
      );

      // Upload new images
      for (let i = 0; i < req.files.length; i++) {

        const imageUrl = await uploadToS3(req.files[i]);

        await db.query(
          `INSERT INTO product_images 
           (product_id, image_url, is_primary)
           VALUES (?,?,?)`,
          [productId, imageUrl, i === 0 ? 1 : 0]
        );
      }
    }

    res.json({ message: "Product updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Product update failed",
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
