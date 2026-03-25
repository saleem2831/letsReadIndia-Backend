import express from "express";
// import {
//   submitParentForm,
//   submitSchoolForm,
// } from "../controllers/forms.controller.js";

import { submitParentForm,submitSchoolForm,submitContactForm } from "../controllers/forms.controller.js";

const router = express.Router();

// Parent Inquiry
router.post("/parent", submitParentForm);

// School Inquiry
router.post("/school", submitSchoolForm);
router.post("/contact", submitContactForm);

export default router;