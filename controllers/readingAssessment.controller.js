// // import crypto from "node:crypto";
// // import { db } from "../config/db.js";
// // import { READING_AGE_ITEMS } from "../config/readingAgeItems.js";
// // import { calculateReadingAge, classifyReader, getIntervention } from "../utils/readingAge.js";
// // import { generateReadingResultPDF } from "../services/readingResultPdf.service.js";
// // import { sendReadingResultEmail } from "../services/email.service.js";

// // const clean = (value, length) => String(value ?? "").trim().slice(0, length);
// // const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// // export const getReadingAssessmentItems = (_req, res) => res.json({
// //   success: true,
// //   data: READING_AGE_ITEMS,
// // });

// // export const completeReadingAssessment = async (req, res) => {
// //   let connection;
// //   try {
// //     const student = {
// //       name: clean(req.body.student_name, 150),
// //       age: Number(req.body.age),
// //       className: clean(req.body.class_name, 100),
// //       city: clean(req.body.city, 100),
// //       country: clean(req.body.country, 100),
// //       school: clean(req.body.school_name, 200),
// //       email: clean(req.body.email, 190).toLowerCase() || null,
// //       countryCode: clean(req.body.whatsapp_country_code, 10).replace(/[^+\d]/g, "") || null,
// //       whatsapp: clean(req.body.whatsapp_number, 30).replace(/\D/g, "") || null,
// //     };
// //     if (!student.name || !student.className || !student.city || !student.country || !student.school) {
// //       return res.status(400).json({ message: "Please complete all required student details" });
// //     }
// //     if (!Number.isInteger(student.age) || student.age < 3 || student.age > 18) {
// //       return res.status(400).json({ message: "Age must be between 3 and 18" });
// //     }
// //     if (!student.email || !emailPattern.test(student.email)) {
// //       return res.status(400).json({ message: "A valid parent email address is required" });
// //     }

// //     const b4 = req.body.b4 === true;
// //     const responses = Array.isArray(req.body.responses) ? req.body.responses : [];
// //     const calculation = b4 ? {
// //       readingAge: "B4", readingAgeMonths: null, intervention: getIntervention("B4"),
// //       lastCorrect: null, correctCount: 0, incorrectCount: 0,
// //       stoppedByThreeErrors: false, processedResponses: [],
// //     } : calculateReadingAge(responses);

// //     const completedAll = calculation.processedResponses.length === READING_AGE_ITEMS.length;
// //     if (!b4 && (!calculation.stoppedByThreeErrors && !completedAll)) {
// //       return res.status(422).json({ message: "Assessment is incomplete" });
// //     }
// //     if (!b4 && responses.length !== calculation.processedResponses.length) {
// //       return res.status(422).json({ message: "Responses were submitted after the test should have stopped" });
// //     }

// //     const chronologicalMonths = student.age * 12;
// //     const gap = calculation.readingAgeMonths === null ? null : chronologicalMonths - calculation.readingAgeMonths;
// //     const classification = classifyReader(calculation.readingAgeMonths, chronologicalMonths);
// //     const assessmentNumber = `RA-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

// //     connection = await db.getConnection();
// //     await connection.beginTransaction();
// //     const [studentInsert] = await connection.query(
// //       `INSERT INTO reading_students
// //        (name,age_years,class_name,city,country,school_name,email,whatsapp_country_code,whatsapp_number)
// //        VALUES (?,?,?,?,?,?,?,?,?)`,
// //       [student.name, student.age, student.className, student.city, student.country, student.school,
// //         student.email, student.countryCode, student.whatsapp],
// //     );
// //     const [assessmentInsert] = await connection.query(
// //       `INSERT INTO reading_assessments
// //        (assessment_number,student_id,chronological_age_months,reading_age_code,reading_age_months,
// //         reading_gap_months,classification,intervention,correct_count,incorrect_count,
// //         last_correct_item_index,last_correct_item,status)
// //        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
// //       [assessmentNumber, studentInsert.insertId, chronologicalMonths, calculation.readingAge,
// //         calculation.readingAgeMonths, gap, classification, calculation.intervention,
// //         calculation.correctCount, calculation.incorrectCount, calculation.lastCorrect?.index ?? null,
// //         calculation.lastCorrect?.text ?? null, calculation.readingAge === "B4" ? "b4" : "completed"],
// //     );
// //     for (const [index, answer] of calculation.processedResponses.entries()) {
// //       await connection.query(
// //         `INSERT INTO reading_assessment_responses
// //          (assessment_id,item_index,item_text,ra_key,is_correct,response_order) VALUES (?,?,?,?,?,?)`,
// //         [assessmentInsert.insertId, answer.item_index, answer.text, answer.ra, answer.correct ? 1 : 0, index + 1],
// //       );
// //     }
// //     await connection.commit();
// //     connection.release();
// //     connection = null;

// //     const reportResult = {
// //       reading_age_code: calculation.readingAge,
// //       reading_age_months: calculation.readingAgeMonths,
// //       reading_gap_months: gap,
// //       classification,
// //       intervention: calculation.intervention,
// //       correct_count: calculation.correctCount,
// //       incorrect_count: calculation.incorrectCount,
// //       last_correct_item: calculation.lastCorrect?.text ?? null,
// //       responses: calculation.processedResponses.map((answer, responseIndex) => ({
// //         item_text: answer.text, ra_key: answer.ra, is_correct: answer.correct ? 1 : 0, response_order: responseIndex + 1,
// //       })),
// //     };
// //     let emailDelivery;
// //     let resultPdfBuffer = null;
// //     try {
// //       resultPdfBuffer = await generateReadingResultPDF({
// //         assessmentNumber,
// //         student: { name: student.name, age_years: student.age, class_name: student.className,
// //           city: student.city, country: student.country, school_name: student.school },
// //         result: reportResult,
// //         completedAt: new Date(),
// //       });
// //       emailDelivery = await sendReadingResultEmail({
// //         to: student.email, studentName: student.name, readingAge: calculation.readingAge,
// //         classification, assessmentNumber, pdfBuffer: resultPdfBuffer,
// //       });
// //     } catch (emailError) {
// //       console.error("READING RESULT EMAIL ERROR", emailError);
// //       emailDelivery = { sent: false, error: emailError.message || "Email delivery failed" };
// //     }
// //     await db.query(
// //       `UPDATE reading_assessments SET parent_email_sent=?,parent_email_sent_at=?,email_error=? WHERE id=?`,
// //       [emailDelivery.sent ? 1 : 0, emailDelivery.sent ? new Date() : null, emailDelivery.sent ? null : emailDelivery.error,
// //         assessmentInsert.insertId],
// //     ).catch((updateError) => console.error("READING EMAIL STATUS UPDATE ERROR", updateError.message));

// //     res.status(201).json({
// //       success: true,
// //       assessment_number: assessmentNumber,
// //       email_delivery: emailDelivery,
// //       pdf: resultPdfBuffer ? {
// //         filename: `${assessmentNumber}-reading-age-result.pdf`,
// //         base64: resultPdfBuffer.toString("base64"),
// //       } : null,
// //       result: {
// //         chronological_age_months: chronologicalMonths,
// //         reading_age: calculation.readingAge,
// //         reading_age_months: calculation.readingAgeMonths,
// //         reading_gap_months: gap,
// //         classification,
// //         intervention: calculation.intervention,
// //         correct_count: calculation.correctCount,
// //         incorrect_count: calculation.incorrectCount,
// //         total_attempted: calculation.processedResponses.length,
// //         last_correct: calculation.lastCorrect,
// //         completed_at: new Date().toISOString(),
// //       },
// //     });
// //   } catch (error) {
// //     if (connection) await connection.rollback().catch(() => {});
// //     console.error("READING ASSESSMENT ERROR", error);
// //     res.status(/sequence|response|unknown|boolean|required/i.test(error.message) ? 400 : 500)
// //       .json({ message: error.message || "Assessment could not be saved" });
// //   } finally {
// //     connection?.release();
// //   }
// // };

// // export const getReadingAssessments = async (req, res) => {
// //   try {
// //     const page = Math.max(1, Number(req.query.page) || 1);
// //     const limit = 20;
// //     const search = clean(req.query.search, 100);
// //     const where = search
// //       ? "WHERE s.name LIKE ? OR s.school_name LIKE ? OR a.assessment_number LIKE ?"
// //       : "";
// //     const values = search ? Array(3).fill(`%${search}%`) : [];
// //     const [data] = await db.query(
// //       `SELECT a.*,s.name AS student_name,s.age_years,s.class_name,s.city,s.country,s.school_name,s.email,
// //               s.whatsapp_country_code,s.whatsapp_number
// //        FROM reading_assessments a JOIN reading_students s ON s.id=a.student_id
// //        ${where} ORDER BY a.completed_at DESC LIMIT ? OFFSET ?`,
// //       [...values, limit, (page - 1) * limit],
// //     );
// //     const [[count]] = await db.query(
// //       `SELECT COUNT(*) total FROM reading_assessments a JOIN reading_students s ON s.id=a.student_id ${where}`,
// //       values,
// //     );
// //     res.json({ data, pagination: { page, total: count.total, pages: Math.ceil(count.total / limit) } });
// //   } catch (error) {
// //     console.error("READING ADMIN ERROR", error);
// //     res.status(500).json({ message: "Unable to load assessments" });
// //   }
// // };

// // export const getReadingAssessment = async (req, res) => {
// //   try {
// //     const [[assessment]] = await db.query(
// //       `SELECT a.*,s.name AS student_name,s.age_years,s.class_name,s.city,s.country,s.school_name,s.email,
// //               s.whatsapp_country_code,s.whatsapp_number
// //        FROM reading_assessments a JOIN reading_students s ON s.id=a.student_id WHERE a.id=?`,
// //       [req.params.id],
// //     );
// //     if (!assessment) return res.status(404).json({ message: "Assessment not found" });
// //     const [responses] = await db.query(
// //       "SELECT item_index,item_text,ra_key,is_correct,response_order FROM reading_assessment_responses WHERE assessment_id=? ORDER BY response_order",
// //       [req.params.id],
// //     );
// //     res.json({ data: { ...assessment, responses } });
// //   } catch (error) {
// //     res.status(500).json({ message: "Unable to load assessment" });
// //   }
// // };

// // const loadAssessmentReport = async (assessmentId) => {
// //   const [[row]] = await db.query(
// //     `SELECT a.*,s.name,s.age_years,s.class_name,s.city,s.country,s.school_name,s.email
// //      FROM reading_assessments a JOIN reading_students s ON s.id=a.student_id WHERE a.id=?`,
// //     [assessmentId],
// //   );
// //   if (!row) return null;
// //   const [responses] = await db.query(
// //     `SELECT item_text,ra_key,is_correct,response_order FROM reading_assessment_responses
// //      WHERE assessment_id=? ORDER BY response_order`, [assessmentId],
// //   );
// //   return {
// //     row,
// //     student: { name: row.name, age_years: row.age_years, class_name: row.class_name, city: row.city,
// //       country: row.country, school_name: row.school_name },
// //     result: { reading_age_code: row.reading_age_code, reading_age_months: row.reading_age_months,
// //       reading_gap_months: row.reading_gap_months, classification: row.classification,
// //       intervention: row.intervention, correct_count: row.correct_count, incorrect_count: row.incorrect_count,
// //       last_correct_item: row.last_correct_item, responses },
// //   };
// // };

// // export const resendReadingAssessmentEmail = async (req, res) => {
// //   try {
// //     const report = await loadAssessmentReport(req.params.id);
// //     if (!report) return res.status(404).json({ message: "Assessment not found" });
// //     if (!report.row.email) return res.status(400).json({ message: "This assessment has no parent email" });
// //     const pdfBuffer = await generateReadingResultPDF({ assessmentNumber: report.row.assessment_number,
// //       student: report.student, result: report.result, completedAt: report.row.completed_at });
// //     const delivery = await sendReadingResultEmail({ to: report.row.email, studentName: report.row.name,
// //       readingAge: report.row.reading_age_code, classification: report.row.classification,
// //       assessmentNumber: report.row.assessment_number, pdfBuffer });
// //     if (!delivery.sent) {
// //       await db.query("UPDATE reading_assessments SET parent_email_sent=0,email_error=? WHERE id=?",
// //         [delivery.error, req.params.id]);
// //       return res.status(503).json({ message: delivery.error || "Email delivery failed" });
// //     }
// //     await db.query(
// //       "UPDATE reading_assessments SET parent_email_sent=1,parent_email_sent_at=NOW(),email_error=NULL WHERE id=?",
// //       [req.params.id],
// //     );
// //     return res.json({ message: `PDF result sent to ${report.row.email}` });
// //   } catch (error) {
// //     console.error("READING EMAIL RESEND ERROR", error);
// //     await db.query("UPDATE reading_assessments SET parent_email_sent=0,email_error=? WHERE id=?",
// //       [error.message || "Email delivery failed", req.params.id]).catch(() => {});
// //     return res.status(500).json({ message: error.message || "Unable to send result email" });
// //   }
// // };

// // export const downloadReadingAssessmentPDF = async (req, res) => {
// //   try {
// //     const report = await loadAssessmentReport(req.params.id);
// //     if (!report) return res.status(404).json({ message: "Assessment not found" });
// //     const pdfBuffer = await generateReadingResultPDF({ assessmentNumber: report.row.assessment_number,
// //       student: report.student, result: report.result, completedAt: report.row.completed_at });
// //     res.setHeader("Content-Type", "application/pdf");
// //     res.setHeader("Content-Disposition", `attachment; filename="${report.row.assessment_number}-reading-age-result.pdf"`);
// //     return res.send(pdfBuffer);
// //   } catch (error) {
// //     console.error("READING PDF DOWNLOAD ERROR", error);
// //     return res.status(500).json({ message: "Unable to generate assessment PDF" });
// //   }
// // };

// // export const deleteReadingAssessment = async (req, res) => {
// //   let connection;
// //   try {
// //     connection = await db.getConnection();
// //     await connection.beginTransaction();
// //     const [[assessment]] = await connection.query(
// //       "SELECT student_id FROM reading_assessments WHERE id=? FOR UPDATE", [req.params.id],
// //     );
// //     if (!assessment) { await connection.rollback(); return res.status(404).json({ message: "Assessment not found" }); }
// //     await connection.query("DELETE FROM reading_assessment_responses WHERE assessment_id=?", [req.params.id]);
// //     await connection.query("DELETE FROM reading_assessments WHERE id=?", [req.params.id]);
// //     const [[remaining]] = await connection.query(
// //       "SELECT COUNT(*) total FROM reading_assessments WHERE student_id=?", [assessment.student_id],
// //     );
// //     if (!remaining.total) await connection.query("DELETE FROM reading_students WHERE id=?", [assessment.student_id]);
// //     await connection.commit();
// //     return res.json({ message: "Reading assessment deleted" });
// //   } catch (error) {
// //     if (connection) await connection.rollback().catch(() => {});
// //     console.error("READING ASSESSMENT DELETE ERROR", error);
// //     return res.status(500).json({ message: "Unable to delete assessment" });
// //   } finally { connection?.release(); }
// // };


// import crypto from "node:crypto";
// import { db } from "../config/db.js";
// import { READING_AGE_ITEMS } from "../config/readingAgeItems.js";
// import { calculateReadingAge, classifyReader, getIntervention } from "../utils/readingAge.js";
// import { generateReadingResultPDF } from "../services/readingResultPdf.service.js";
// import { sendReadingResultEmail } from "../services/email.service.js";
// import { sendReadingTestResultWhatsApp } from "../services/whatsapp.service.js";

// const clean = (value, length) => String(value ?? "").trim().slice(0, length);
// const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// export const getReadingAssessmentItems = (_req, res) => res.json({
//   success: true,
//   data: READING_AGE_ITEMS,
// });

// export const completeReadingAssessment = async (req, res) => {
//   let connection;
//   try {
//     const student = {
//       name: clean(req.body.student_name, 150),
//       age: Number(req.body.age),
//       className: clean(req.body.class_name, 100),
//       city: clean(req.body.city, 100),
//       country: clean(req.body.country, 100),
//       school: clean(req.body.school_name, 200),
//       email: clean(req.body.email, 190).toLowerCase() || null,
//       countryCode: clean(req.body.whatsapp_country_code, 10).replace(/[^+\d]/g, "") || null,
//       whatsapp: clean(req.body.whatsapp_number, 30).replace(/\D/g, "") || null,
//     };
//     if (!student.name || !student.className || !student.city || !student.country || !student.school) {
//       return res.status(400).json({ message: "Please complete all required student details" });
//     }
//     if (!Number.isInteger(student.age) || student.age < 3 || student.age > 18) {
//       return res.status(400).json({ message: "Age must be between 3 and 18" });
//     }
//     if (!student.email || !emailPattern.test(student.email)) {
//       return res.status(400).json({ message: "A valid parent email address is required" });
//     }

//     const b4 = req.body.b4 === true;
//     const responses = Array.isArray(req.body.responses) ? req.body.responses : [];
//     const calculation = b4 ? {
//       readingAge: "B4", readingAgeMonths: null, intervention: getIntervention("B4"),
//       lastCorrect: null, correctCount: 0, incorrectCount: 0,
//       stoppedByThreeErrors: false, processedResponses: [],
//     } : calculateReadingAge(responses);

//     const completedAll = calculation.processedResponses.length === READING_AGE_ITEMS.length;
//     if (!b4 && (!calculation.stoppedByThreeErrors && !completedAll)) {
//       return res.status(422).json({ message: "Assessment is incomplete" });
//     }
//     if (!b4 && responses.length !== calculation.processedResponses.length) {
//       return res.status(422).json({ message: "Responses were submitted after the test should have stopped" });
//     }

//     const chronologicalMonths = student.age * 12;
//     const gap = calculation.readingAgeMonths === null ? null : chronologicalMonths - calculation.readingAgeMonths;
//     const classification = classifyReader(calculation.readingAgeMonths, chronologicalMonths);
//     const assessmentNumber = `RA-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

//     connection = await db.getConnection();
//     await connection.beginTransaction();
//     const [studentInsert] = await connection.query(
//       `INSERT INTO reading_students
//        (name,age_years,class_name,city,country,school_name,email,whatsapp_country_code,whatsapp_number)
//        VALUES (?,?,?,?,?,?,?,?,?)`,
//       [student.name, student.age, student.className, student.city, student.country, student.school,
//         student.email, student.countryCode, student.whatsapp],
//     );
//     const [assessmentInsert] = await connection.query(
//       `INSERT INTO reading_assessments
//        (assessment_number,student_id,chronological_age_months,reading_age_code,reading_age_months,
//         reading_gap_months,classification,intervention,correct_count,incorrect_count,
//         last_correct_item_index,last_correct_item,status)
//        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
//       [assessmentNumber, studentInsert.insertId, chronologicalMonths, calculation.readingAge,
//         calculation.readingAgeMonths, gap, classification, calculation.intervention,
//         calculation.correctCount, calculation.incorrectCount, calculation.lastCorrect?.index ?? null,
//         calculation.lastCorrect?.text ?? null, calculation.readingAge === "B4" ? "b4" : "completed"],
//     );
//     for (const [index, answer] of calculation.processedResponses.entries()) {
//       await connection.query(
//         `INSERT INTO reading_assessment_responses
//          (assessment_id,item_index,item_text,ra_key,is_correct,response_order) VALUES (?,?,?,?,?,?)`,
//         [assessmentInsert.insertId, answer.item_index, answer.text, answer.ra, answer.correct ? 1 : 0, index + 1],
//       );
//     }
//     await connection.commit();
//     connection.release();
//     connection = null;

//     const reportResult = {
//       reading_age_code: calculation.readingAge,
//       reading_age_months: calculation.readingAgeMonths,
//       reading_gap_months: gap,
//       classification,
//       intervention: calculation.intervention,
//       correct_count: calculation.correctCount,
//       incorrect_count: calculation.incorrectCount,
//       last_correct_item: calculation.lastCorrect?.text ?? null,
//       responses: calculation.processedResponses.map((answer, responseIndex) => ({
//         item_text: answer.text, ra_key: answer.ra, is_correct: answer.correct ? 1 : 0, response_order: responseIndex + 1,
//       })),
//     };
//     let emailDelivery;
//     let resultPdfBuffer = null;
//     try {
//       resultPdfBuffer = await generateReadingResultPDF({
//         assessmentNumber,
//         student: { name: student.name, age_years: student.age, class_name: student.className,
//           city: student.city, country: student.country, school_name: student.school },
//         result: reportResult,
//         completedAt: new Date(),
//       });
//       emailDelivery = await sendReadingResultEmail({
//         to: student.email, studentName: student.name, readingAge: calculation.readingAge,
//         classification, assessmentNumber, pdfBuffer: resultPdfBuffer,
//       });
//     } catch (emailError) {
//       console.error("READING RESULT EMAIL ERROR", emailError);
//       emailDelivery = { sent: false, error: emailError.message || "Email delivery failed" };
//     }
//     await db.query(
//       `UPDATE reading_assessments SET parent_email_sent=?,parent_email_sent_at=?,email_error=? WHERE id=?`,
//       [emailDelivery.sent ? 1 : 0, emailDelivery.sent ? new Date() : null, emailDelivery.sent ? null : emailDelivery.error,
//         assessmentInsert.insertId],
//     ).catch((updateError) => console.error("READING EMAIL STATUS UPDATE ERROR", updateError.message));

//     let whatsappDelivery = { sent: false, skipped: true, message: "WhatsApp number was not provided" };
//     if (student.whatsapp) {
//       try {
//         whatsappDelivery = await sendReadingTestResultWhatsApp({
//           countryCode: student.countryCode,
//           whatsappNumber: student.whatsapp,
//           studentName: student.name,
//           readingAge: calculation.readingAge,
//           classification,
//           correctCount: calculation.correctCount,
//           incorrectCount: calculation.incorrectCount,
//           assessmentNumber,
//         });
//         console.log("READING WHATSAPP SENT", whatsappDelivery.messageId);
//       } catch (whatsappError) {
//         console.error("READING WHATSAPP ERROR", whatsappError.message);
//         whatsappDelivery = { sent: false, skipped: false, error: whatsappError.message || "WhatsApp delivery failed" };
//       }
//     }

//     res.status(201).json({
//       success: true,
//       assessment_number: assessmentNumber,
//       email_delivery: emailDelivery,
//       whatsapp_delivery: whatsappDelivery,
//       pdf: resultPdfBuffer ? {
//         filename: `${assessmentNumber}-reading-age-result.pdf`,
//         base64: resultPdfBuffer.toString("base64"),
//       } : null,
//       result: {
//         chronological_age_months: chronologicalMonths,
//         reading_age: calculation.readingAge,
//         reading_age_months: calculation.readingAgeMonths,
//         reading_gap_months: gap,
//         classification,
//         intervention: calculation.intervention,
//         correct_count: calculation.correctCount,
//         incorrect_count: calculation.incorrectCount,
//         total_attempted: calculation.processedResponses.length,
//         last_correct: calculation.lastCorrect,
//         completed_at: new Date().toISOString(),
//       },
//     });
//   } catch (error) {
//     if (connection) await connection.rollback().catch(() => {});
//     console.error("READING ASSESSMENT ERROR", error);
//     res.status(/sequence|response|unknown|boolean|required/i.test(error.message) ? 400 : 500)
//       .json({ message: error.message || "Assessment could not be saved" });
//   } finally {
//     connection?.release();
//   }
// };

// export const getReadingAssessments = async (req, res) => {
//   try {
//     const page = Math.max(1, Number(req.query.page) || 1);
//     const limit = 20;
//     const search = clean(req.query.search, 100);
//     const where = search
//       ? "WHERE s.name LIKE ? OR s.school_name LIKE ? OR a.assessment_number LIKE ?"
//       : "";
//     const values = search ? Array(3).fill(`%${search}%`) : [];
//     const [data] = await db.query(
//       `SELECT a.*,s.name AS student_name,s.age_years,s.class_name,s.city,s.country,s.school_name,s.email,
//               s.whatsapp_country_code,s.whatsapp_number
//        FROM reading_assessments a JOIN reading_students s ON s.id=a.student_id
//        ${where} ORDER BY a.completed_at DESC LIMIT ? OFFSET ?`,
//       [...values, limit, (page - 1) * limit],
//     );
//     const [[count]] = await db.query(
//       `SELECT COUNT(*) total FROM reading_assessments a JOIN reading_students s ON s.id=a.student_id ${where}`,
//       values,
//     );
//     res.json({ data, pagination: { page, total: count.total, pages: Math.ceil(count.total / limit) } });
//   } catch (error) {
//     console.error("READING ADMIN ERROR", error);
//     res.status(500).json({ message: "Unable to load assessments" });
//   }
// };

// export const getReadingAssessment = async (req, res) => {
//   try {
//     const [[assessment]] = await db.query(
//       `SELECT a.*,s.name AS student_name,s.age_years,s.class_name,s.city,s.country,s.school_name,s.email,
//               s.whatsapp_country_code,s.whatsapp_number
//        FROM reading_assessments a JOIN reading_students s ON s.id=a.student_id WHERE a.id=?`,
//       [req.params.id],
//     );
//     if (!assessment) return res.status(404).json({ message: "Assessment not found" });
//     const [responses] = await db.query(
//       "SELECT item_index,item_text,ra_key,is_correct,response_order FROM reading_assessment_responses WHERE assessment_id=? ORDER BY response_order",
//       [req.params.id],
//     );
//     res.json({ data: { ...assessment, responses } });
//   } catch (error) {
//     res.status(500).json({ message: "Unable to load assessment" });
//   }
// };

// const loadAssessmentReport = async (assessmentId) => {
//   const [[row]] = await db.query(
//     `SELECT a.*,s.name,s.age_years,s.class_name,s.city,s.country,s.school_name,s.email
//      FROM reading_assessments a JOIN reading_students s ON s.id=a.student_id WHERE a.id=?`,
//     [assessmentId],
//   );
//   if (!row) return null;
//   const [responses] = await db.query(
//     `SELECT item_text,ra_key,is_correct,response_order FROM reading_assessment_responses
//      WHERE assessment_id=? ORDER BY response_order`, [assessmentId],
//   );
//   return {
//     row,
//     student: { name: row.name, age_years: row.age_years, class_name: row.class_name, city: row.city,
//       country: row.country, school_name: row.school_name },
//     result: { reading_age_code: row.reading_age_code, reading_age_months: row.reading_age_months,
//       reading_gap_months: row.reading_gap_months, classification: row.classification,
//       intervention: row.intervention, correct_count: row.correct_count, incorrect_count: row.incorrect_count,
//       last_correct_item: row.last_correct_item, responses },
//   };
// };

// export const resendReadingAssessmentEmail = async (req, res) => {
//   try {
//     const report = await loadAssessmentReport(req.params.id);
//     if (!report) return res.status(404).json({ message: "Assessment not found" });
//     if (!report.row.email) return res.status(400).json({ message: "This assessment has no parent email" });
//     const pdfBuffer = await generateReadingResultPDF({ assessmentNumber: report.row.assessment_number,
//       student: report.student, result: report.result, completedAt: report.row.completed_at });
//     const delivery = await sendReadingResultEmail({ to: report.row.email, studentName: report.row.name,
//       readingAge: report.row.reading_age_code, classification: report.row.classification,
//       assessmentNumber: report.row.assessment_number, pdfBuffer });
//     if (!delivery.sent) {
//       await db.query("UPDATE reading_assessments SET parent_email_sent=0,email_error=? WHERE id=?",
//         [delivery.error, req.params.id]);
//       return res.status(503).json({ message: delivery.error || "Email delivery failed" });
//     }
//     await db.query(
//       "UPDATE reading_assessments SET parent_email_sent=1,parent_email_sent_at=NOW(),email_error=NULL WHERE id=?",
//       [req.params.id],
//     );
//     return res.json({ message: `PDF result sent to ${report.row.email}` });
//   } catch (error) {
//     console.error("READING EMAIL RESEND ERROR", error);
//     await db.query("UPDATE reading_assessments SET parent_email_sent=0,email_error=? WHERE id=?",
//       [error.message || "Email delivery failed", req.params.id]).catch(() => {});
//     return res.status(500).json({ message: error.message || "Unable to send result email" });
//   }
// };

// export const downloadReadingAssessmentPDF = async (req, res) => {
//   try {
//     const report = await loadAssessmentReport(req.params.id);
//     if (!report) return res.status(404).json({ message: "Assessment not found" });
//     const pdfBuffer = await generateReadingResultPDF({ assessmentNumber: report.row.assessment_number,
//       student: report.student, result: report.result, completedAt: report.row.completed_at });
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="${report.row.assessment_number}-reading-age-result.pdf"`);
//     return res.send(pdfBuffer);
//   } catch (error) {
//     console.error("READING PDF DOWNLOAD ERROR", error);
//     return res.status(500).json({ message: "Unable to generate assessment PDF" });
//   }
// };

// export const deleteReadingAssessment = async (req, res) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.beginTransaction();
//     const [[assessment]] = await connection.query(
//       "SELECT student_id FROM reading_assessments WHERE id=? FOR UPDATE", [req.params.id],
//     );
//     if (!assessment) { await connection.rollback(); return res.status(404).json({ message: "Assessment not found" }); }
//     await connection.query("DELETE FROM reading_assessment_responses WHERE assessment_id=?", [req.params.id]);
//     await connection.query("DELETE FROM reading_assessments WHERE id=?", [req.params.id]);
//     const [[remaining]] = await connection.query(
//       "SELECT COUNT(*) total FROM reading_assessments WHERE student_id=?", [assessment.student_id],
//     );
//     if (!remaining.total) await connection.query("DELETE FROM reading_students WHERE id=?", [assessment.student_id]);
//     await connection.commit();
//     return res.json({ message: "Reading assessment deleted" });
//   } catch (error) {
//     if (connection) await connection.rollback().catch(() => {});
//     console.error("READING ASSESSMENT DELETE ERROR", error);
//     return res.status(500).json({ message: "Unable to delete assessment" });
//   } finally { connection?.release(); }
// };


import crypto from "node:crypto";
import { db } from "../config/db.js";
import { READING_AGE_ITEMS } from "../config/readingAgeItems.js";
import { calculateReadingAge, classifyReader, getIntervention } from "../utils/readingAge.js";
import { generateReadingResultPDF } from "../services/readingResultPdf.service.js";
import { sendReadingResultEmail } from "../services/email.service.js";
import { sendReadingTestResultWhatsApp } from "../services/whatsapp.service.js";

const clean = (value, length) => String(value ?? "").trim().slice(0, length);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readingResultLinkSecret = () => {
  const secret = String(process.env.READING_RESULT_LINK_SECRET || process.env.JWT_SECRET || "");
  if (secret.length < 32) {
    throw new Error("READING_RESULT_LINK_SECRET must contain at least 32 characters");
  }
  return secret;
};

const createReadingResultToken = (assessmentId) => {
  const configuredDays = Number(process.env.READING_RESULT_LINK_TTL_DAYS || 30);
  const ttlDays = Number.isFinite(configuredDays) ? Math.min(365, Math.max(1, configuredDays)) : 30;
  const expiresAt = Date.now() + (ttlDays * 24 * 60 * 60 * 1000);
  const value = `${assessmentId}.${expiresAt}`;
  const signature = crypto.createHmac("sha256", readingResultLinkSecret()).update(value).digest("base64url");
  return `${value}.${signature}`;
};

const verifyReadingResultToken = (token) => {
  const [assessmentIdText, expiresAtText, providedSignature, ...extra] = String(token || "").split(".");
  const assessmentId = Number(assessmentIdText);
  const expiresAt = Number(expiresAtText);
  if (extra.length || !Number.isInteger(assessmentId) || assessmentId < 1
      || !Number.isFinite(expiresAt) || expiresAt <= Date.now() || !providedSignature) {
    return null;
  }

  const value = `${assessmentId}.${expiresAt}`;
  const expectedSignature = crypto.createHmac("sha256", readingResultLinkSecret())
    .update(value).digest("base64url");
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);
  if (expectedBuffer.length !== providedBuffer.length
      || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    return null;
  }
  return assessmentId;
};

const readingResultPublicUrl = (token) => {
  const apiUrl = String(process.env.PUBLIC_API_URL || "https://api.letsreadindia.in").replace(/\/+$/, "");
  return `${apiUrl}/api/reading-assessments/result/${encodeURIComponent(token)}`;
};

export const getReadingAssessmentItems = (_req, res) => res.json({
  success: true,
  data: READING_AGE_ITEMS,
});

export const completeReadingAssessment = async (req, res) => {
  let connection;
  try {
    const student = {
      name: clean(req.body.student_name, 150),
      age: Number(req.body.age),
      className: clean(req.body.class_name, 100),
      city: clean(req.body.city, 100),
      country: clean(req.body.country, 100),
      school: clean(req.body.school_name, 200),
      email: clean(req.body.email, 190).toLowerCase() || null,
      countryCode: clean(req.body.whatsapp_country_code, 10).replace(/[^+\d]/g, "") || null,
      whatsapp: clean(req.body.whatsapp_number, 30).replace(/\D/g, "") || null,
    };
    if (!student.name || !student.className || !student.city || !student.country || !student.school) {
      return res.status(400).json({ message: "Please complete all required student details" });
    }
    if (!Number.isInteger(student.age) || student.age < 3 || student.age > 18) {
      return res.status(400).json({ message: "Age must be between 3 and 18" });
    }
    if (!student.email || !emailPattern.test(student.email)) {
      return res.status(400).json({ message: "A valid parent email address is required" });
    }

    const b4 = req.body.b4 === true;
    const responses = Array.isArray(req.body.responses) ? req.body.responses : [];
    const calculation = b4 ? {
      readingAge: "B4", readingAgeMonths: null, intervention: getIntervention("B4"),
      lastCorrect: null, correctCount: 0, incorrectCount: 0,
      stoppedByThreeErrors: false, processedResponses: [],
    } : calculateReadingAge(responses);

    const completedAll = calculation.processedResponses.length === READING_AGE_ITEMS.length;
    if (!b4 && (!calculation.stoppedByThreeErrors && !completedAll)) {
      return res.status(422).json({ message: "Assessment is incomplete" });
    }
    if (!b4 && responses.length !== calculation.processedResponses.length) {
      return res.status(422).json({ message: "Responses were submitted after the test should have stopped" });
    }

    const chronologicalMonths = student.age * 12;
    const gap = calculation.readingAgeMonths === null ? null : chronologicalMonths - calculation.readingAgeMonths;
    const classification = classifyReader(calculation.readingAgeMonths, chronologicalMonths);
    const assessmentNumber = `RA-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    connection = await db.getConnection();
    await connection.beginTransaction();
    const [studentInsert] = await connection.query(
      `INSERT INTO reading_students
       (name,age_years,class_name,city,country,school_name,email,whatsapp_country_code,whatsapp_number)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [student.name, student.age, student.className, student.city, student.country, student.school,
        student.email, student.countryCode, student.whatsapp],
    );
    const [assessmentInsert] = await connection.query(
      `INSERT INTO reading_assessments
       (assessment_number,student_id,chronological_age_months,reading_age_code,reading_age_months,
        reading_gap_months,classification,intervention,correct_count,incorrect_count,
        last_correct_item_index,last_correct_item,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [assessmentNumber, studentInsert.insertId, chronologicalMonths, calculation.readingAge,
        calculation.readingAgeMonths, gap, classification, calculation.intervention,
        calculation.correctCount, calculation.incorrectCount, calculation.lastCorrect?.index ?? null,
        calculation.lastCorrect?.text ?? null, calculation.readingAge === "B4" ? "b4" : "completed"],
    );
    for (const [index, answer] of calculation.processedResponses.entries()) {
      await connection.query(
        `INSERT INTO reading_assessment_responses
         (assessment_id,item_index,item_text,ra_key,is_correct,response_order) VALUES (?,?,?,?,?,?)`,
        [assessmentInsert.insertId, answer.item_index, answer.text, answer.ra, answer.correct ? 1 : 0, index + 1],
      );
    }
    await connection.commit();
    connection.release();
    connection = null;

    const reportResult = {
      reading_age_code: calculation.readingAge,
      reading_age_months: calculation.readingAgeMonths,
      reading_gap_months: gap,
      classification,
      intervention: calculation.intervention,
      correct_count: calculation.correctCount,
      incorrect_count: calculation.incorrectCount,
      last_correct_item: calculation.lastCorrect?.text ?? null,
      responses: calculation.processedResponses.map((answer, responseIndex) => ({
        item_text: answer.text, ra_key: answer.ra, is_correct: answer.correct ? 1 : 0, response_order: responseIndex + 1,
      })),
    };
    let emailDelivery;
    let resultPdfBuffer = null;
    try {
      resultPdfBuffer = await generateReadingResultPDF({
        assessmentNumber,
        student: { name: student.name, age_years: student.age, class_name: student.className,
          city: student.city, country: student.country, school_name: student.school },
        result: reportResult,
        completedAt: new Date(),
      });
      emailDelivery = await sendReadingResultEmail({
        to: student.email, studentName: student.name, readingAge: calculation.readingAge,
        classification, assessmentNumber, pdfBuffer: resultPdfBuffer,
      });
    } catch (emailError) {
      console.error("READING RESULT EMAIL ERROR", emailError);
      emailDelivery = { sent: false, error: emailError.message || "Email delivery failed" };
    }
    await db.query(
      `UPDATE reading_assessments SET parent_email_sent=?,parent_email_sent_at=?,email_error=? WHERE id=?`,
      [emailDelivery.sent ? 1 : 0, emailDelivery.sent ? new Date() : null, emailDelivery.sent ? null : emailDelivery.error,
        assessmentInsert.insertId],
    ).catch((updateError) => console.error("READING EMAIL STATUS UPDATE ERROR", updateError.message));

    let pdfDownloadToken = null;
    let pdfDownloadUrl = null;
    try {
      pdfDownloadToken = createReadingResultToken(assessmentInsert.insertId);
      pdfDownloadUrl = readingResultPublicUrl(pdfDownloadToken);
    } catch (linkError) {
      console.error("READING PDF LINK ERROR", linkError.message);
    }

    let whatsappDelivery = { sent: false, skipped: true, message: "WhatsApp number was not provided" };
    if (student.whatsapp) {
      try {
        whatsappDelivery = await sendReadingTestResultWhatsApp({
          countryCode: student.countryCode,
          whatsappNumber: student.whatsapp,
          studentName: student.name,
          readingAge: calculation.readingAge,
          classification,
          intervention: calculation.intervention,
          assessmentNumber,
          pdfDownloadToken,
        });
        console.log("READING WHATSAPP SENT", whatsappDelivery.messageId);
      } catch (whatsappError) {
        console.error("READING WHATSAPP ERROR", whatsappError.message);
        whatsappDelivery = { sent: false, skipped: false, error: whatsappError.message || "WhatsApp delivery failed" };
      }
    }

    res.status(201).json({
      success: true,
      assessment_number: assessmentNumber,
      email_delivery: emailDelivery,
      whatsapp_delivery: whatsappDelivery,
      pdf_download_url: pdfDownloadUrl,
      pdf: resultPdfBuffer ? {
        filename: `${assessmentNumber}-reading-age-result.pdf`,
        base64: resultPdfBuffer.toString("base64"),
      } : null,
      result: {
        chronological_age_months: chronologicalMonths,
        reading_age: calculation.readingAge,
        reading_age_months: calculation.readingAgeMonths,
        reading_gap_months: gap,
        classification,
        intervention: calculation.intervention,
        correct_count: calculation.correctCount,
        incorrect_count: calculation.incorrectCount,
        total_attempted: calculation.processedResponses.length,
        last_correct: calculation.lastCorrect,
        completed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error("READING ASSESSMENT ERROR", error);
    res.status(/sequence|response|unknown|boolean|required/i.test(error.message) ? 400 : 500)
      .json({ message: error.message || "Assessment could not be saved" });
  } finally {
    connection?.release();
  }
};

export const getReadingAssessments = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;
    const search = clean(req.query.search, 100);
    const where = search
      ? "WHERE s.name LIKE ? OR s.school_name LIKE ? OR a.assessment_number LIKE ?"
      : "";
    const values = search ? Array(3).fill(`%${search}%`) : [];
    const [data] = await db.query(
      `SELECT a.*,s.name AS student_name,s.age_years,s.class_name,s.city,s.country,s.school_name,s.email,
              s.whatsapp_country_code,s.whatsapp_number
       FROM reading_assessments a JOIN reading_students s ON s.id=a.student_id
       ${where} ORDER BY a.completed_at DESC LIMIT ? OFFSET ?`,
      [...values, limit, (page - 1) * limit],
    );
    const [[count]] = await db.query(
      `SELECT COUNT(*) total FROM reading_assessments a JOIN reading_students s ON s.id=a.student_id ${where}`,
      values,
    );
    res.json({ data, pagination: { page, total: count.total, pages: Math.ceil(count.total / limit) } });
  } catch (error) {
    console.error("READING ADMIN ERROR", error);
    res.status(500).json({ message: "Unable to load assessments" });
  }
};

export const getReadingAssessment = async (req, res) => {
  try {
    const [[assessment]] = await db.query(
      `SELECT a.*,s.name AS student_name,s.age_years,s.class_name,s.city,s.country,s.school_name,s.email,
              s.whatsapp_country_code,s.whatsapp_number
       FROM reading_assessments a JOIN reading_students s ON s.id=a.student_id WHERE a.id=?`,
      [req.params.id],
    );
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });
    const [responses] = await db.query(
      "SELECT item_index,item_text,ra_key,is_correct,response_order FROM reading_assessment_responses WHERE assessment_id=? ORDER BY response_order",
      [req.params.id],
    );
    res.json({ data: { ...assessment, responses } });
  } catch (error) {
    res.status(500).json({ message: "Unable to load assessment" });
  }
};

const loadAssessmentReport = async (assessmentId) => {
  const [[row]] = await db.query(
    `SELECT a.*,s.name,s.age_years,s.class_name,s.city,s.country,s.school_name,s.email
     FROM reading_assessments a JOIN reading_students s ON s.id=a.student_id WHERE a.id=?`,
    [assessmentId],
  );
  if (!row) return null;
  const [responses] = await db.query(
    `SELECT item_text,ra_key,is_correct,response_order FROM reading_assessment_responses
     WHERE assessment_id=? ORDER BY response_order`, [assessmentId],
  );
  return {
    row,
    student: { name: row.name, age_years: row.age_years, class_name: row.class_name, city: row.city,
      country: row.country, school_name: row.school_name },
    result: { reading_age_code: row.reading_age_code, reading_age_months: row.reading_age_months,
      reading_gap_months: row.reading_gap_months, classification: row.classification,
      intervention: row.intervention, correct_count: row.correct_count, incorrect_count: row.incorrect_count,
      last_correct_item: row.last_correct_item, responses },
  };
};

export const downloadPublicReadingAssessmentPDF = async (req, res) => {
  try {
    const assessmentId = verifyReadingResultToken(req.params.token);
    if (!assessmentId) {
      return res.status(403).json({ message: "This result link is invalid or has expired" });
    }
    const report = await loadAssessmentReport(assessmentId);
    if (!report) return res.status(404).json({ message: "Assessment not found" });
    const pdfBuffer = await generateReadingResultPDF({
      assessmentNumber: report.row.assessment_number,
      student: report.student,
      result: report.result,
      completedAt: report.row.completed_at,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${report.row.assessment_number}-reading-age-result.pdf"`,
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("PUBLIC READING PDF DOWNLOAD ERROR", error);
    return res.status(500).json({ message: "Unable to generate assessment PDF" });
  }
};

export const resendReadingAssessmentEmail = async (req, res) => {
  try {
    const report = await loadAssessmentReport(req.params.id);
    if (!report) return res.status(404).json({ message: "Assessment not found" });
    if (!report.row.email) return res.status(400).json({ message: "This assessment has no parent email" });
    const pdfBuffer = await generateReadingResultPDF({ assessmentNumber: report.row.assessment_number,
      student: report.student, result: report.result, completedAt: report.row.completed_at });
    const delivery = await sendReadingResultEmail({ to: report.row.email, studentName: report.row.name,
      readingAge: report.row.reading_age_code, classification: report.row.classification,
      assessmentNumber: report.row.assessment_number, pdfBuffer });
    if (!delivery.sent) {
      await db.query("UPDATE reading_assessments SET parent_email_sent=0,email_error=? WHERE id=?",
        [delivery.error, req.params.id]);
      return res.status(503).json({ message: delivery.error || "Email delivery failed" });
    }
    await db.query(
      "UPDATE reading_assessments SET parent_email_sent=1,parent_email_sent_at=NOW(),email_error=NULL WHERE id=?",
      [req.params.id],
    );
    return res.json({ message: `PDF result sent to ${report.row.email}` });
  } catch (error) {
    console.error("READING EMAIL RESEND ERROR", error);
    await db.query("UPDATE reading_assessments SET parent_email_sent=0,email_error=? WHERE id=?",
      [error.message || "Email delivery failed", req.params.id]).catch(() => {});
    return res.status(500).json({ message: error.message || "Unable to send result email" });
  }
};

export const downloadReadingAssessmentPDF = async (req, res) => {
  try {
    const report = await loadAssessmentReport(req.params.id);
    if (!report) return res.status(404).json({ message: "Assessment not found" });
    const pdfBuffer = await generateReadingResultPDF({ assessmentNumber: report.row.assessment_number,
      student: report.student, result: report.result, completedAt: report.row.completed_at });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${report.row.assessment_number}-reading-age-result.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("READING PDF DOWNLOAD ERROR", error);
    return res.status(500).json({ message: "Unable to generate assessment PDF" });
  }
};

export const deleteReadingAssessment = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [[assessment]] = await connection.query(
      "SELECT student_id FROM reading_assessments WHERE id=? FOR UPDATE", [req.params.id],
    );
    if (!assessment) { await connection.rollback(); return res.status(404).json({ message: "Assessment not found" }); }
    await connection.query("DELETE FROM reading_assessment_responses WHERE assessment_id=?", [req.params.id]);
    await connection.query("DELETE FROM reading_assessments WHERE id=?", [req.params.id]);
    const [[remaining]] = await connection.query(
      "SELECT COUNT(*) total FROM reading_assessments WHERE student_id=?", [assessment.student_id],
    );
    if (!remaining.total) await connection.query("DELETE FROM reading_students WHERE id=?", [assessment.student_id]);
    await connection.commit();
    return res.json({ message: "Reading assessment deleted" });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error("READING ASSESSMENT DELETE ERROR", error);
    return res.status(500).json({ message: "Unable to delete assessment" });
  } finally { connection?.release(); }
};
