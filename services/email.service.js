import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendOrderEmail = async (order) => {
  await transporter.sendMail({
    from: '"LetsReadIndia" <no-reply@letsreadindia.com>',
    to: order.email,
    subject: `Order Confirmed - ${order.order_number}`,
    html: `
      <h2>Thank you for your order</h2>
      <p>Order ID: <b>${order.order_number}</b></p>
      <p>Total: ₹${order.total}</p>
      <p>We will notify you once shipped.</p>
    `
  });
};


/* ================= PARENT INQUIRY EMAIL ================= */

export const sendParentInquiryEmail = async (data) => {
  await transporter.sendMail({
    from: `"LetsReadIndia Website" <${process.env.EMAIL_USER}>`,
    to: "support@letsreadindia.com,shaiksaleem2831@gmail.com", // where you want to receive
    subject: "New Parent Inquiry",
    html: `
      <h3>New Parent Inquiry Received</h3>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      <p><strong>Child Age:</strong> ${data.childAge}</p>
    `,
  });
};

/* ================= SCHOOL INQUIRY EMAIL ================= */

export const sendSchoolInquiryEmail = async (data) => {
  await transporter.sendMail({
    from: `"LetsReadIndia Website" <${process.env.EMAIL_USER}>`,
    to: "support@letsreadindia.com,shaiksaleem2831@gmail.com",
    subject: "New School Inquiry",
    html: `
      <h3>New School Inquiry Received</h3>
      <p><strong>School Name:</strong> ${data.schoolName}</p>
      <p><strong>Contact Person:</strong> ${data.contactPerson}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      <p><strong>Student Count:</strong> ${data.studentCount}</p>
    `,
  });
};

export const sendContactEmail = async (data) => {
  await transporter.sendMail({
    from: `"LetsReadIndia Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // You receive the contact email
    subject: `New Contact Form: ${data.subject}`,
    html: `
      <h2>New Contact Inquiry</h2>
      <p><b>Name:</b> ${data.name}</p>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Phone:</b> ${data.phone}</p>
      <p><b>Subject:</b> ${data.subject}</p>
      <p><b>Message:</b></p>
      <p>${data.message}</p>
    `
  });
};