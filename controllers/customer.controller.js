import { db } from "../config/db.js";
import PDFDocument from "pdfkit";
import path from "path";
import qr from "qr-image";
import bwipjs from "bwip-js";

/* ===============================
   TRACK ORDER BY ORDER NUMBER
================================ */
// export const getCustomerOrderByNumber = async (req, res) => {
//   try {
//     const { orderNumber } = req.params;

//     const [[order]] = await db.query(
//       `SELECT * FROM orders WHERE order_number = ?`,
//       [orderNumber]
//     );

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const [items] = await db.query(
//       `SELECT 
//           p.name,
//           oi.quantity,
//           oi.price,
//           (oi.quantity * oi.price) AS total
//        FROM order_items oi
//        JOIN products p ON p.id = oi.product_id
//        WHERE oi.order_id = ?`,
//       [order.id]
//     );

//     res.json({ order, items });
//   } catch {
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const getCustomerOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const [[order]] = await db.query(
      `SELECT 
        id,
        order_number,
        customer_name,
        email,
        phone,
        address,
        city,
        state,
        country,
        pincode,
        subtotal,
        delivery_fee,
        total,
        payment_status,
        shipment_status,
        status,
        waybill,
        courier_name,
        created_at,
        delivered_at 
       FROM orders 
       WHERE order_number = ?`,
      [orderNumber]
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // const [items] = await db.query(
    //   `SELECT 
    //       p.name,
    //       oi.quantity,
    //       oi.price,
    //       (oi.quantity * oi.price) AS total
    //    FROM order_items oi
    //    JOIN products p ON p.id = oi.product_id
    //    WHERE oi.order_id = ?`,
    //   [order.id]
    // );

       const [items] = await db.query(
      `SELECT 
          oi.id,             
        p.name,
         oi.quantity,
         oi.price,
          (oi.quantity * oi.price) AS total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    res.json({
      order,
      items,
      tracking_url: order.waybill
        ? `https://shiprocket.co/tracking/${order.waybill}`
        : null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



/* ===============================
   DOWNLOAD INVOICE BY ORDER NUMBER
================================ */
// export const downloadInvoiceByOrderNumber = async (req, res) => {
//   try {
//     const { orderNumber } = req.params;

//     const [[order]] = await db.query(
//       `SELECT * FROM orders WHERE order_number = ?`,
//       [orderNumber]
//     );

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const [items] = await db.query(
//       `SELECT p.name, oi.quantity, oi.price
//        FROM order_items oi
//        JOIN products p ON p.id = oi.product_id
//        WHERE oi.order_id=?`,
//       [order.id]
//     );

//     const doc = new PDFDocument();

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=invoice-${order.order_number}.pdf`
//     );

//     doc.pipe(res);

//     doc.fontSize(20).text("Invoice", { align: "center" });
//     doc.moveDown();

//     doc.text(`Order #: ${order.order_number}`);
//     doc.text(`Customer: ${order.customer_name}`);
//     doc.text(`Phone: ${order.phone}`);
//     doc.text(`Address: ${order.address}`);
//     doc.text(`Total: ₹ ${order.total}`);

//     doc.moveDown();
//     doc.text("Items:");
//     doc.moveDown();

//     items.forEach((item) => {
//       doc.text(`${item.name} - ${item.quantity} x ₹${item.price}`);
//     });

//     doc.end();
//   } catch {
//     res.status(500).json({ message: "Server error" });
//   }
// };


// export const downloadInvoiceByOrderNumber = async (req, res) => {
//   try {
//     const { orderNumber } = req.params;

//     const [[order]] = await db.query(
//       `SELECT * FROM orders WHERE order_number = ?`,
//       [orderNumber]
//     );

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const [items] = await db.query(
//       `SELECT p.name, oi.quantity, oi.price,
//               (oi.quantity * oi.price) as total
//        FROM order_items oi
//        JOIN products p ON p.id = oi.product_id
//        WHERE oi.order_id=?`,
//       [order.id]
//     );

//     const doc = new PDFDocument({ margin: 50 });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=invoice-${order.order_number}.pdf`
//     );

//     doc.pipe(res);

//     /* ================= HEADER ================= */

//     doc
//       .fontSize(22)
//       .fillColor("#2563eb")
//       .text("LetsReadIndia", { align: "left" });

//     doc
//       .fontSize(10)
//       .fillColor("black")
//       .text("Online Book Store")
//       .text("Email: support@letsreadindia.com")
//       .moveDown();

//     doc
//       .fontSize(18)
//       .fillColor("black")
//       .text("INVOICE", { align: "right" });

//     doc.moveDown();

//     /* ================= ORDER DETAILS ================= */

//     doc.fontSize(12);
//     doc.text(`Invoice No: ${order.order_number}`);
//     doc.text(
//       `Invoice Date: ${new Date(order.created_at).toLocaleDateString("en-IN")}`
//     );
//     doc.moveDown();

//     /* ================= BILLING INFO ================= */

//     doc.fontSize(14).text("Bill To:", { underline: true });
//     doc.moveDown(0.5);

//     doc
//       .fontSize(12)
//       .text(order.customer_name)
//       .text(order.address)
//       .text(`${order.city}, ${order.state} - ${order.pincode}`)
//       .text(order.country || "India")
//       .text(`Phone: ${order.phone}`)
//       .moveDown();

//     /* ================= TABLE HEADER ================= */

//     doc.moveDown();
//     doc.fontSize(12).text("Items", { underline: true });
//     doc.moveDown();

//     const tableTop = doc.y;

//     doc
//       .fontSize(11)
//       .text("Item", 50, tableTop)
//       .text("Qty", 300, tableTop)
//       .text("Price", 350, tableTop)
//       .text("Total", 450, tableTop);

//     doc.moveDown();

//     /* ================= ITEMS ================= */

//     let position = doc.y;

//     items.forEach((item) => {
//       doc
//         .fontSize(10)
//         .text(item.name, 50, position)
//         .text(item.quantity, 300, position)
//         .text(`₹ ${item.price}`, 350, position)
//         .text(`₹ ${item.total}`, 450, position);

//       position += 20;
//     });

//     doc.moveDown(2);

//     /* ================= TOTALS ================= */

//     doc
//       .fontSize(12)
//       .text(`Subtotal: ₹ ${order.subtotal}`, { align: "right" })
//       .text(`Delivery Fee: ₹ ${order.delivery_fee}`, { align: "right" })
//       .moveDown(0.5)
//       .fontSize(14)
//       .fillColor("#16a34a")
//       .text(`Grand Total: ₹ ${order.total}`, { align: "right" });

//     doc.moveDown(2);

//     /* ================= TRACKING INFO ================= */

//     if (order.waybill) {
//       doc
//         .fontSize(12)
//         .fillColor("black")
//         .text(`Tracking ID: ${order.waybill}`)
//         .text(`Courier: ${order.courier_name}`);
//     }

//     /* ================= FOOTER ================= */

//     doc.moveDown(4);
//     doc
//       .fontSize(10)
//       .fillColor("gray")
//       .text("Thank you for shopping with LetsReadIndia!", { align: "center" })
//       .text(
//         "This is a computer generated invoice. No signature required.",
//         { align: "center" }
//       );

//     doc.end();
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };



// export const downloadInvoiceByOrderNumber = async (req, res) => {
//   try {
//     const { orderNumber } = req.params;

//     const [[order]] = await db.query(
//       `SELECT * FROM orders WHERE order_number = ?`,
//       [orderNumber]
//     );

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const [items] = await db.query(
//       `SELECT p.name, oi.quantity, oi.price,
//               (oi.quantity * oi.price) as total
//        FROM order_items oi
//        JOIN products p ON p.id = oi.product_id
//        WHERE oi.order_id=?`,
//       [order.id]
//     );

//     const doc = new PDFDocument({ margin: 40 });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=invoice-${order.order_number}.pdf`
//     );

//     doc.pipe(res);

//     /* ================= PAGE BORDER ================= */

//     doc
//       .rect(10, 10, doc.page.width - 20, doc.page.height - 20)
//       .lineWidth(1)
//       .strokeColor("#2563eb")
//       .stroke();

//     /* ================= LOGO ================= */

//     const logoPath = path.join("public", "logo.png"); // place logo in public folder
//     doc.image(logoPath, 50, 40, { width: 120 });

//     /* ================= COMPANY DETAILS ================= */

//     doc
//       .fontSize(10)
//       .text("LetsReadIndia Pvt Ltd", 350, 40, { align: "right" })
//       .text("GSTIN: 29ABCDE1234F1Z5", { align: "right" })
//       .text("Email: support@letsreadindia.com", { align: "right" });

//     doc.moveDown(4);





//     /* ================= INVOICE TITLE ================= */

// doc
//   .fontSize(20)
//   .fillColor("#2563eb")
//   .text("TAX INVOICE", 0, doc.y, {
//     width: doc.page.width,
//     align: "center"
//   });

// doc.moveDown(2);

// /* ================= ORDER DETAILS ================= */

// doc.x = doc.page.margins.left; // ensure left alignment

// doc
//   .fontSize(12)
//   .fillColor("black")
//   .text(`Invoice No: ${order.order_number}`)
//   .text(
//     `Invoice Date: ${new Date(order.created_at).toLocaleDateString("en-IN")}`
//   )
//   .moveDown();

// /* ================= BILLING ================= */

// doc.fontSize(14).text("Bill To:", { underline: true });
// doc.moveDown(0.5);

// doc
//   .fontSize(12)
//   .text(order.customer_name)
//   .text(order.address)
//   .text(`${order.city}, ${order.state} - ${order.pincode}`)
//   .text(order.country || "India")
//   .text(`Phone: ${order.phone}`);

// doc.moveDown(2);


//     /* ================= TABLE HEADER ================= */

//     // const tableTop = doc.y;

//     // doc
//     //   .fontSize(11)
//     //   .text("Item", 50, tableTop)
//     //   .text("Qty", 300, tableTop)
//     //   .text("Price", 350, tableTop)
//     //   .text("Total", 450, tableTop);

//     // doc.moveDown();

//     // /* ================= ITEMS ================= */

//     // let position = doc.y;

//     // items.forEach((item) => {
//     //   doc
//     //     .fontSize(10)
//     //     .text(item.name, 50, position)
//     //     .text(item.quantity, 300, position)
//     //     .text(`₹ ${item.price}`, 350, position)
//     //     .text(`₹ ${item.total}`, 450, position);

//     //   position += 20;
//     // });

//     // doc.moveDown(2);

//     // /* ================= TOTALS ================= */

//     // doc
//     //   .fontSize(12)
//     //   .text(`Subtotal: ₹ ${order.subtotal}`, { align: "right" })
//     //   .text(`Delivery Fee: ₹ ${order.delivery_fee}`, { align: "right" })
//     //   .moveDown(0.5)
//     //   .fontSize(14)
//     //   .fillColor("#16a34a")
//     //   .text(`Grand Total: ₹ ${order.total}`, { align: "right" });

//     // doc.moveDown(2);

// /* ================= TABLE HEADER ================= */

// const tableTop = doc.y;
// const itemX = 50;
// const qtyX = 300;
// const priceX = 360;
// const totalX = 450;
// const rowHeight = 25;

// doc.fontSize(11).font("Helvetica-Bold");

// doc.text("Item", itemX, tableTop);
// doc.text("Qty", qtyX, tableTop);
// doc.text("Price", priceX, tableTop);
// doc.text("Total", totalX, tableTop);

// // Draw header line
// doc.moveTo(50, tableTop + 15)
//    .lineTo(550, tableTop + 15)
//    .stroke();

// let position = tableTop + rowHeight;

// /* ================= ITEMS ================= */

// doc.font("Helvetica").fontSize(10);

// let subtotal = 0;

// items.forEach((item) => {
//   const itemTotal = item.quantity * item.price;
//   subtotal += itemTotal;

//   doc.text(item.name, itemX, position);
//   doc.text(item.quantity.toString(), qtyX, position);
//   doc.text(`₹ ${item.price.toFixed(2)}`, priceX, position);
//   doc.text(`₹ ${itemTotal.toFixed(2)}`, totalX, position);

//   // Row divider
//   doc.moveTo(50, position + 18)
//      .lineTo(550, position + 18)
//      .stroke();

//   position += rowHeight;
// });

// /* ================= TAX CALCULATION ================= */

// // Example: 18% GST
// const taxRate = 0.18;
// const taxAmount = subtotal * taxRate;

// // Subtotal including tax
// const subtotalWithTax = subtotal + taxAmount;

// // Delivery fee
// const deliveryFee = order.delivery_fee || 0;

// // Final Grand Total
// const grandTotal = subtotalWithTax + deliveryFee;

// /* ================= TOTALS SECTION ================= */

// doc.moveDown(2);

// doc.fontSize(11).font("Helvetica");

// doc.text(`Subtotal: ₹ ${subtotal.toFixed(2)}`, { align: "right" });
// doc.text(`Tax (18%): ₹ ${taxAmount.toFixed(2)}`, { align: "right" });
// doc.text(`Subtotal (Incl. Tax): ₹ ${subtotalWithTax.toFixed(2)}`, { align: "right" });
// doc.text(`Delivery Fee: ₹ ${deliveryFee.toFixed(2)}`, { align: "right" });

// doc.moveDown(0.5);

// doc.fontSize(14)
//    .fillColor("#16a34a")
//    .font("Helvetica-Bold")
//    .text(`Grand Total: ₹ ${grandTotal.toFixed(2)}`, { align: "right" });

// doc.fillColor("black");

// /* ================= RETURN FINAL VALUE ================= */

// return grandTotal;

//     /* ================= QR CODE (Tracking) ================= */

//     if (order.waybill) {
//       const trackingUrl = `https://shiprocket.co/tracking/${order.waybill}`;
//       const qrImage = qr.imageSync(trackingUrl, { type: "png" });

//       doc.image(qrImage, 50, doc.y, { width: 100 });

//       doc
//         .fontSize(10)
//         .text("Scan to Track Shipment", 50, doc.y + 105);
//     }
//     // if (order.waybill) {
//     //   const trackingUrl = `https://shiprocket.co/tracking/12255151`;
//     //   const qrImage = qr.imageSync(trackingUrl, { type: "png" });

//     //   doc.image(qrImage, 50, doc.y, { width: 100 });

//     //   doc
//     //     .fontSize(10)
//     //     .text("Scan to Track Shipment", 50, doc.y + 105);
//     // }
//     /* ================= BARCODE ================= */

//     // const barcodeBuffer = await bwipjs.toBuffer({
//     //   bcid: "code128",
//     //   text: order.order_number,
//     //   scale: 3,
//     //   height: 10,
//     //   includetext: true,
//     // });

//     // doc.image(barcodeBuffer, 350, doc.y - 120, { width: 200 });

//     /* ================= BARCODE ================= */

// const barcodeBuffer = await bwipjs.toBuffer({
//   bcid: "code128",
//   text: order.order_number,
//   scale: 3,
//   height: 10,
//   includetext: true,
// });

// // Calculate center position
// const barcodeWidth = 200;
// const centerX =
//   (doc.page.width - barcodeWidth) / 2;

// // Move slightly down before placing
// doc.moveDown(2);

// // Centered barcode
// doc.image(barcodeBuffer, centerX, doc.y, {
//   width: barcodeWidth,
// });


//     /* ================= FOOTER ================= */

//     // doc.moveDown(5);

//     // doc
//     //   .fontSize(10)
//     //   .fillColor("gray")
//     //   .text("Thank you for shopping with LetsReadIndia!", {
//     //     align: "center",
//     //   })
//     //   .text(
//     //     "This is a computer generated invoice and does not require signature.",
//     //     { align: "center" }
//     //   );

//     /* ================= FOOTER ================= */

// doc.moveDown(4);


// doc
//   .fontSize(10)
//   .fillColor("gray")
//   .text("Thank you for shopping with LetsReadIndia!", {
//     align: "left",
//   });

// doc.moveDown(0.3);

// // Force single line centered
// doc.text(
//   "This is a computer generated invoice and does not require signature.",
//   {
//     align: "left",
//     lineBreak: false,
//   }
// );


//     doc.end();
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// export const downloadInvoiceByOrderNumber = async (req, res) => {
//   try {
//     const { orderNumber } = req.params;

//     const [[order]] = await db.query(
//       `SELECT * FROM orders WHERE order_number = ?`,
//       [orderNumber]
//     );

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const [items] = await db.query(
//       `SELECT p.name, oi.quantity, oi.price
//        FROM order_items oi
//        JOIN products p ON p.id = oi.product_id
//        WHERE oi.order_id=?`,
//       [order.id]
//     );

//     const doc = new PDFDocument({ margin: 40 });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=invoice-${order.order_number}.pdf`
//     );

//     doc.pipe(res);


//      /* ================= PAGE BORDER ================= */

//     doc
//       .rect(10, 10, doc.page.width - 20, doc.page.height - 20)
//       .lineWidth(1)
//       .strokeColor("#2563eb")
//       .stroke();

//     /* ================= LOGO ================= */

//     const logoPath = path.join("public", "logo.png"); // place logo in public folder
//     doc.image(logoPath, 50, 40, { width: 120 });

//     /* ================= COMPANY DETAILS ================= */

//     doc
//       .fontSize(10)
//       .text("LetsReadIndia Pvt Ltd", 350, 40, { align: "right" })
//       .text("GSTIN: 29ABCDE1234F1Z5", { align: "right" })
//       .text("Email: support@letsreadindia.com", { align: "right" });

//     doc.moveDown(4);

//     /* ================= INVOICE TITLE ================= */

// doc
//   .fontSize(20)
//   .fillColor("#2563eb")
//   .text("TAX INVOICE", 0, doc.y, {
//     width: doc.page.width,
//     align: "center"
//   });

// doc.moveDown(2);

// /* ================= ORDER DETAILS ================= */

// doc.x = doc.page.margins.left; // ensure left alignment

// doc
//   .fontSize(12)
//   .fillColor("black")
//   .text(`Invoice No: ${order.order_number}`)
//   .text(
//     `Invoice Date: ${new Date(order.created_at).toLocaleDateString("en-IN")}`
//   )
//   .moveDown();

// /* ================= BILLING ================= */

// doc.fontSize(14).text("Bill To:", { underline: true });
// doc.moveDown(0.5);

// doc
//   .fontSize(12)
//   .text(order.customer_name)
//   .text(order.address)
//   .text(`${order.city}, ${order.state} - ${order.pincode}`)
//   .text(order.country || "India")
//   .text(`Phone: ${order.phone}`);

// doc.moveDown(2);

//     /* ================= TABLE ================= */

//     const tableTop = doc.y;
//     const itemX = 50;
//     const qtyX = 300;
//     const priceX = 360;
//     const totalX = 450;
//     const rowHeight = 25;

//     doc.fontSize(11).font("Helvetica-Bold");

//     doc.text("Item", itemX, tableTop);
//     doc.text("Qty", qtyX, tableTop);
//     doc.text("Price", priceX, tableTop);
//     doc.text("Total", totalX, tableTop);

//     doc.moveTo(50, tableTop + 15)
//        .lineTo(550, tableTop + 15)
//        .stroke();

//     let position = tableTop + rowHeight;

//     doc.font("Helvetica").fontSize(10);

//     let subtotal = 0;

//     items.forEach((item) => {
//       const price = Number(item.price) || 0;
//       const quantity = Number(item.quantity) || 0;
//       const itemTotal = price * quantity;

//       subtotal += itemTotal;

//       doc.text(item.name, itemX, position);
//       doc.text(quantity.toString(), qtyX, position);
//       doc.text(`₹ ${price.toFixed(2)}`, priceX, position);
//       doc.text(`₹ ${itemTotal.toFixed(2)}`, totalX, position);

//       doc.moveTo(50, position + 18)
//          .lineTo(550, position + 18)
//          .stroke();

//       position += rowHeight;
//     });

//     /* ================= TAX ================= */

//     const taxRate = 0.18;
//     const taxAmount = subtotal * taxRate;
//     const relsubtotal = subtotal - taxAmount
//     const subtotalWithTax = relsubtotal + taxAmount;
//     const deliveryFee = Number(order.delivery_fee) || 0;
//     const grandTotal = subtotalWithTax + deliveryFee;

//     doc.moveDown(2);

//     doc.fontSize(11).font("Helvetica");

//     doc.text(`Subtotal: ₹ ${relsubtotal.toFixed(2)}`, { align: "left" });
//     doc.text(`Tax (18%): ₹ ${taxAmount.toFixed(2)}`, { align: "left" });
//     doc.text(`Delivery Fee: ₹ ${deliveryFee.toFixed(2)}`, { align: "left" });

//     doc.moveDown(0.5);

//     doc.fontSize(12)
//        .fillColor("#16a34a")
//        .font("Helvetica-Bold")
//        .text(`Grand Total: ₹ ${grandTotal.toFixed(2)}`, { align: "left" });

//     doc.fillColor("black");

//     /* ================= QR CODE ================= */

//     if (order.waybill) {
//       const trackingUrl = `https://shiprocket.co/tracking/${order.waybill}`;
//       const qrImage = qr.imageSync(trackingUrl, { type: "png" });

//       doc.moveDown(2);
//       doc.image(qrImage, 50, doc.y, { width: 100 });
//       doc.moveDown();
//       doc.text("Scan to Track Shipment", 50);
//     }

//     /* ================= BARCODE ================= */

//     const barcodeBuffer = await bwipjs.toBuffer({
//       bcid: "code128",
//       text: order.order_number,
//       scale: 3,
//       height: 10,
//       includetext: true,
//     });

//     doc.moveDown(2);

//     const barcodeWidth = 200;
//     const centerX = (doc.page.width - barcodeWidth) / 2;

//     doc.image(barcodeBuffer, centerX, doc.y, {
//       width: barcodeWidth,
//     });

//     /* ================= FOOTER ================= */

//     // doc.moveDown(4);

//     // doc.fontSize(10)
//     //    .fillColor("gray")
//     //    .text("Thank you for shopping with LetsReadIndia!", { align: "left" });

//     // doc.moveDown(0.3);

//     // doc.text(
//     //   "This is a computer generated invoice and does not require signature.",
//     //   { align: "left" }
//     // );

//     // doc.end(); // ✅ only once

//     const footerY = doc.page.height - 70; // distance from bottom

// doc
//   .fontSize(10)
//   .fillColor("gray")
//   .text(
//     "Thank you for shopping with LetsReadIndia!",
//     0,
//     footerY,
//     {
//       align: "center",
//       width: doc.page.width,
//     }
//   );

// doc.moveDown(0.3);

// doc.text(
//   "This is a computer generated invoice and does not require signature.",
//   {
//     align: "center",
//     width: doc.page.width,
//   }
// );

// doc.end();
//   } catch (err) {
//     console.error(err);

//     if (!res.headersSent) {
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// };

export const downloadInvoiceByOrderNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const [[order]] = await db.query(
      `SELECT * FROM orders WHERE order_number = ?`,
      [orderNumber]
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const [items] = await db.query(
      `SELECT p.name, oi.quantity, oi.price
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id=?`,
      [order.id]
    );

    /* ================= PRE-CALCULATIONS ================= */

    let barcodeBuffer = null;
    let qrImage = null;

    // ✅ FIX: generate BEFORE stream
    try {
      barcodeBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: order.order_number,
        scale: 3,
        height: 10,
        includetext: true,
      });
    } catch {}

    try {
      if (order.waybill) {
        qrImage = qr.imageSync(
          `https://shiprocket.co/tracking/${order.waybill}`,
          { type: "png" }
        );
      }
    } catch {}

    /* ================= PDF START ================= */

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.order_number}.pdf`
    );

    doc.pipe(res);

    /* ================= HEADER ================= */

    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      doc.image(logoPath, 50, 40, { width: 100 });
    } catch {}


    const rightX = 40; // margin

    // doc
    //   .fontSize(18)
    //   .fillColor("#2563eb")
    //   .text("LetsReadIndia Pvt Ltd", 200, 40);

    // doc
    //   .fontSize(10)
    //   .fillColor("black")
    //   .text("GSTIN: 29ABCDE1234F1Z5", 200)
    //   .text("support@letsreadindia.com", 200);

    doc
  .fontSize(18)
  .fillColor("#2563eb")
  .text("LetsReadIndia Pvt Ltd", rightX, 40, {
    align: "right",
    width: doc.page.width - 80, // full width minus margins
  });

doc
  .fontSize(10)
  .fillColor("black")
  .text("GSTIN: 29ABCDE1234F1Z5", {
    align: "right",
    width: doc.page.width - 80,
  })
  .text("support@letsreadindia.com", {
    align: "right",
    width: doc.page.width - 80,
  });

    doc.moveDown(2);

    /* ================= TITLE ================= */

    doc
      .fontSize(22)
      .fillColor("#111")
      .text("TAX INVOICE", { align: "center" });

    doc.moveDown(1.5);

    /* ================= ORDER INFO ================= */

    doc
      .fontSize(11)
      .text(`Invoice No: ${order.order_number}`)
      .text(
        `Date: ${new Date(order.created_at).toLocaleDateString("en-IN")}`
      );

    doc.moveDown();

    /* ================= BILL TO ================= */

    doc.fontSize(13).text("Bill To", { underline: true });

    doc
      .fontSize(11)
      .text(order.customer_name)
      .text(order.address)
      .text(`${order.city}, ${order.state} - ${order.pincode}`)
      .text(order.phone);

    doc.moveDown(1.5);

    /* ================= TABLE HEADER ================= */

    const startY = doc.y;

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Item", 50, startY)
      .text("Qty", 300, startY)
      .text("Price", 350, startY)
      .text("Total", 450, startY);

    doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();

    /* ================= ITEMS ================= */

    let y = startY + 25;
    let subtotal = 0;

    doc.font("Helvetica").fontSize(10);

    items.forEach((item) => {
      const total = item.price * item.quantity;
      subtotal += total;

      doc.text(item.name, 50, y);
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`₹${item.price}`, 350, y);
      doc.text(`₹${total}`, 450, y);

      y += 20;
    });

    /* ================= TOTAL ================= */

    const tax = subtotal * 0.18;
    const delivery = Number(order.delivery_fee || 0);
    const grandTotal = subtotal + tax + delivery;

    doc.moveDown(2);

    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, { align: "right" });
    doc.text(`GST (18%): ₹${tax.toFixed(2)}`, { align: "right" });
    doc.text(`Delivery: ₹${delivery.toFixed(2)}`, { align: "right" });

    doc
      .fontSize(13)
      .fillColor("#16a34a")
      .text(`Grand Total: ₹${grandTotal.toFixed(2)}`, { align: "right" });

    doc.fillColor("black");

    /* ================= QR ================= */

    if (qrImage) {
      doc.moveDown(2);
      doc.image(qrImage, 50, doc.y, { width: 80 });
      doc.text("Scan to Track", 50);
    }

    /* ================= BARCODE ================= */

    if (barcodeBuffer) {
      doc.moveDown(2);

      const centerX = (doc.page.width - 200) / 2;

      doc.image(barcodeBuffer, centerX, doc.y, { width: 200 });
    }

    /* ================= FOOTER ================= */

    doc.moveDown(3);

    // doc
    //   .fontSize(10)
    //   .fillColor("gray")
    //   .text("Thank you for shopping with LetsReadIndia!", {
    //     align: "center",
    //   });

    // doc.text(
    //   "This is a computer-generated invoice. No signature required.",
    //   { align: "center" }
    // );

    const footerY = doc.page.height - 100; // fixed bottom position

doc
  .fontSize(10)
  .fillColor("gray")
  .text(
    "Thank you for shopping with LetsReadIndia!",
    0,
    footerY,
    {
      align: "center",
      width: doc.page.width,
      lineBreak: false, // ✅ FORCE SINGLE LINE
    }
  );

doc.text(
  "This is a computer-generated invoice. No signature required.",
  {
    align: "center",
    width: doc.page.width,
    lineBreak: false, // ✅ FORCE SINGLE LINE
  }
);

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};

// upto here we RE GOOD AND NEXT WILL BE AT PHASE 2

export const requestReturn = async (req, res) => {
  try {
    const { orderId, orderItemId, reason } = req.body;

    if (!orderId || !orderItemId || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 1️⃣ Get order
    const [[order]] = await db.query(
      "SELECT status, delivered_at FROM orders WHERE id = ?",
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2️⃣ Check delivered
    if (order.status !== "delivered") {
      return res.status(400).json({
        message: "Return allowed only after delivery"
      });
    }

    // 3️⃣ Check 10-day window
    const deliveryDate = new Date(order.delivered_at);
    const today = new Date();
    const diffDays =
      (today - deliveryDate) / (1000 * 60 * 60 * 24);

    if (diffDays > 10) {
      return res.status(400).json({
        message: "Return window expired (10 days)"
      });
    }

    // 4️⃣ Insert return request
    await db.query(
      `INSERT INTO returns (order_id, order_item_id, reason)
       VALUES (?, ?, ?)`,
      [orderId, orderItemId, reason]
    );

    res.json({ message: "Return request submitted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getCustomerOrderDetails = async (req, res) => {
  try {
    const { id, token } = req.query;

    const [[order]] = await db.query(
      `SELECT * FROM orders 
       WHERE id = ? AND tracking_token = ?`,
      [id, token]
    );

const [[returnData]] = await db.query(
  `SELECT status, refunded_at 
   FROM returns 
   WHERE order_id = ?`,
  [id]
);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const [items] = await db.query(
      `SELECT
        p.name,
        oi.quantity,
        oi.price
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [id]
    );

    res.json({
      order,
      items
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
