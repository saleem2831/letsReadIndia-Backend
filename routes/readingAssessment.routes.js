import express from "express";
import { completeReadingAssessment, getReadingAssessmentItems } from "../controllers/readingAssessment.controller.js";

const router = express.Router();
router.get("/items", getReadingAssessmentItems);
router.post("/complete", completeReadingAssessment);
export default router;
