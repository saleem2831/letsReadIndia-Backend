import {
  sendParentInquiryEmail,
  sendSchoolInquiryEmail,
  sendContactEmail
} from "../services/email.service.js";


// export const submitParentForm = async (req, res) => {
//   try {
//     await sendParentInquiryEmail(req.body);
//     res.status(200).json({ message: "Inquiry sent successfully!" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to send email" });
//   }
// };

// export const submitSchoolForm = async (req, res) => {
//   try {
//     await sendSchoolInquiryEmail(req.body);
//     res.status(200).json({ message: "Inquiry sent successfully!" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to send email" });
//   }
// };


export const submitParentForm = async (req, res) => {
  try {
    const { name, email, phone, childAge } = req.body;

    if (!name || !email || !phone || !childAge) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await sendParentInquiryEmail({ name, email, phone, childAge });

    res.status(200).json({ message: "Inquiry sent successfully!" });
  } catch (error) {
    console.error("Parent Form Error:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
};


export const submitSchoolForm = async (req, res) => {
  try {
    const { schoolName, contactPerson, email, phone, studentCount } = req.body;

    if (!schoolName || !contactPerson || !email || !phone || !studentCount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await sendSchoolInquiryEmail({
      schoolName,
      contactPerson,
      email,
      phone,
      studentCount
    });

    res.status(200).json({ message: "Inquiry sent successfully!" });
  } catch (error) {
    console.error("School Form Error:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
};


export const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    await sendContactEmail({ name, email, phone, subject, message });

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Contact Form Error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};