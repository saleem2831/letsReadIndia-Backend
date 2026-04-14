import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// const transporter = nodemailer.createTransport({
//   host: "smtp.zoho.com",
//   port: 465,
//   secure: true, // true for 465
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });



export const sendOrderEmail = async (order) => {
  await transporter.sendMail({
    from: '"LetsReadIndia" <no-reply@letsreadindia.com>',
    to: order.email,
    subject: `🧾 Order Confirmed - ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
        
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background:#111827; color:#ffffff; padding:20px; text-align:center;">
            <h1 style="margin:0; font-size:22px;">LetsReadIndia 📚</h1>
          </div>

          <!-- Body -->
          <div style="padding:20px; color:#333;">
            
            <h2 style="margin-top:0;">Thank you for your order! 🎉</h2>
            
            <p>Hi <b>${order.name || "Customer"}</b>,</p>
            <p>Your order has been successfully placed. We’ll notify you once it is shipped.</p>

            <!-- Order Details -->
            <div style="background:#f9fafb; padding:15px; border-radius:8px; margin:20px 0;">
              <p style="margin:5px 0;"><b>Order ID:</b> ${order.order_number}</p>
              <p style="margin:5px 0;"><b>Total Amount:</b> ₹${order.total}</p>
              <p style="margin:5px 0;"><b>Payment Method:</b> ${order.payment_method || "Online"}</p>
            </div>

            <!-- Buttons -->
            <div style="text-align:center; margin:25px 0;">
              
              <!-- Track Order Button -->
              <a href="https://letsreadindia.in/customer"
                 style="background:#16a34a; color:#fff; padding:12px 20px; text-decoration:none; border-radius:6px; display:inline-block; margin:5px;">
                 🔍 Track Your Order
              </a>

            </div>

            <p>If you have any questions, feel free to contact us.</p>
            <p style="margin-top:20px;">— Team LetsReadIndia ❤️</p>
          </div>

          <!-- Footer -->
          <div style="background:#f3f4f6; padding:15px; text-align:center; font-size:12px; color:#666;">
            <p style="margin:0;">© ${new Date().getFullYear()} LetsReadIndia. All rights reserved.</p>
          </div>

        </div>
      </div>
    `
  });
};

/* ================= PARENT INQUIRY EMAIL ================= */



export const sendParentInquiryEmail = async (data) => {
  await transporter.sendMail({
    from: `"LetsReadIndia Website" <${process.env.EMAIL_USER}>`,
    to: "support@letsreadindia.com,shaiksaleem2831@gmail.com",
    subject: `📩 New Parent Inquiry from ${data.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
        
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background:#111827; color:#ffffff; padding:20px; text-align:center;">
            <h2 style="margin:0;">📚 LetsReadIndia</h2>
            <p style="margin:5px 0 0;">New Parent Inquiry</p>
          </div>

          <!-- Body -->
          <div style="padding:20px; color:#333;">
            
            <p>You have received a new inquiry from your website:</p>

            <!-- Inquiry Details -->
            <div style="background:#f9fafb; padding:15px; border-radius:8px; margin:20px 0;">
              <p><b>👤 Name:</b> ${data.name}</p>
              <p><b>📧 Email:</b> ${data.email}</p>
              <p><b>📱 Phone:</b> ${data.phone}</p>
              <p><b>🎂 Child Age:</b> ${data.childAge}</p>
            </div>

            <!-- Quick Actions -->
            <div style="text-align:center; margin:25px 0;">
              
              <!-- Email Button -->
              <a href="mailto:${data.email}"
                 style="background:#2563eb; color:#fff; padding:10px 18px; text-decoration:none; border-radius:6px; margin:5px; display:inline-block;">
                 ✉️ Reply via Email
              </a>

              <!-- Call Button -->
              <a href="tel:${data.phone}"
                 style="background:#16a34a; color:#fff; padding:10px 18px; text-decoration:none; border-radius:6px; margin:5px; display:inline-block;">
                 📞 Call Now
              </a>

            </div>

            <p style="margin-top:20px;">Please follow up with the parent as soon as possible.</p>
          </div>

          <!-- Footer -->
          <div style="background:#f3f4f6; padding:15px; text-align:center; font-size:12px; color:#666;">
            <p style="margin:0;">© ${new Date().getFullYear()} LetsReadIndia</p>
          </div>

        </div>
      </div>
    `,
  });
};

/* ================= SCHOOL INQUIRY EMAIL ================= */



export const sendSchoolInquiryEmail = async (data) => {
  await transporter.sendMail({
    from: `"LetsReadIndia Website" <${process.env.EMAIL_USER}>`,
    to: "support@letsreadindia.com,shaiksaleem2831@gmail.com",
    subject: `🏫 New School Inquiry - ${data.schoolName}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
        
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background:#111827; color:#ffffff; padding:20px; text-align:center;">
            <h2 style="margin:0;">📚 LetsReadIndia</h2>
            <p style="margin:5px 0 0;">🏫 New School Inquiry</p>
          </div>

          <!-- Body -->
          <div style="padding:20px; color:#333;">
            
            <p>You have received a new school partnership inquiry:</p>

            <!-- School Details -->
            <div style="background:#f9fafb; padding:15px; border-radius:8px; margin:20px 0;">
              <p><b>🏫 School Name:</b> ${data.schoolName}</p>
              <p><b>👤 Contact Person:</b> ${data.contactPerson}</p>
              <p><b>📧 Email:</b> ${data.email}</p>
              <p><b>📱 Phone:</b> ${data.phone}</p>
              <p><b>👨‍🎓 Student Count:</b> ${data.studentCount}</p>
            </div>

            <!-- Action Buttons -->
            <div style="text-align:center; margin:25px 0;">
              
              <!-- Email -->
              <a href="mailto:${data.email}"
                 style="background:#2563eb; color:#fff; padding:10px 18px; text-decoration:none; border-radius:6px; margin:5px; display:inline-block;">
                 ✉️ Reply via Email
              </a>

              <!-- Call -->
              <a href="tel:${data.phone}"
                 style="background:#16a34a; color:#fff; padding:10px 18px; text-decoration:none; border-radius:6px; margin:5px; display:inline-block;">
                 📞 Call Now
              </a>

              <!-- WhatsApp -->
              <a href="https://wa.me/91${data.phone}"
                 style="background:#25D366; color:#fff; padding:10px 18px; text-decoration:none; border-radius:6px; margin:5px; display:inline-block;">
                 💬 WhatsApp
              </a>

            </div>

            <p style="margin-top:20px;">
              This could be a high-value partnership. Consider prioritizing this lead.
            </p>

          </div>

          <!-- Footer -->
          <div style="background:#f3f4f6; padding:15px; text-align:center; font-size:12px; color:#666;">
            <p style="margin:0;">© ${new Date().getFullYear()} LetsReadIndia</p>
          </div>

        </div>
      </div>
    `,
  });
};



export const sendContactEmail = async (data) => {
  await transporter.sendMail({
    from: `"LetsReadIndia Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `📬 New Contact Inquiry: ${data.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
        
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background:#111827; color:#ffffff; padding:20px; text-align:center;">
            <h2 style="margin:0;">📚 LetsReadIndia</h2>
            <p style="margin:5px 0 0;">📬 New Contact Inquiry</p>
          </div>

          <!-- Body -->
          <div style="padding:20px; color:#333;">
            
            <p>You have received a new message from your website contact form:</p>

            <!-- Contact Details -->
            <div style="background:#f9fafb; padding:15px; border-radius:8px; margin:20px 0;">
              <p><b>👤 Name:</b> ${data.name}</p>
              <p><b>📧 Email:</b> ${data.email}</p>
              <p><b>📱 Phone:</b> ${data.phone || "N/A"}</p>
              <p><b>📝 Subject:</b> ${data.subject}</p>
            </div>

            <!-- Message Box -->
            <div style="background:#fff7ed; padding:15px; border-radius:8px; border-left:4px solid #f97316; margin:20px 0;">
              <p style="margin:0;"><b>💬 Message:</b></p>
              <p style="margin-top:10px; white-space:pre-line;">${data.message}</p>
            </div>

            <!-- Action Buttons -->
            <div style="text-align:center; margin:25px 0;">
              
              <!-- Reply -->
              <a href="mailto:${data.email}"
                 style="background:#2563eb; color:#fff; padding:10px 18px; text-decoration:none; border-radius:6px; margin:5px; display:inline-block;">
                 ✉️ Reply via Email
              </a>

              <!-- Call -->
              ${
                data.phone
                  ? `
              <a href="tel:${data.phone}"
                 style="background:#16a34a; color:#fff; padding:10px 18px; text-decoration:none; border-radius:6px; margin:5px; display:inline-block;">
                 📞 Call Now
              </a>
              `
                  : ""
              }

              <!-- WhatsApp -->
              ${
                data.phone
                  ? `
              <a href="https://wa.me/91${data.phone}"
                 style="background:#25D366; color:#fff; padding:10px 18px; text-decoration:none; border-radius:6px; margin:5px; display:inline-block;">
                 💬 WhatsApp
              </a>
              `
                  : ""
              }

            </div>

            <p style="margin-top:20px;">
              Please respond to this inquiry at the earliest.
            </p>

          </div>

          <!-- Footer -->
          <div style="background:#f3f4f6; padding:15px; text-align:center; font-size:12px; color:#666;">
            <p style="margin:0;">© ${new Date().getFullYear()} LetsReadIndia</p>
          </div>

        </div>
      </div>
    `
  });
};