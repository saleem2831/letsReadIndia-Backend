import express from "express";
import { listShippingCountries, shippingStatusWebhook } from "../controllers/shipping.controller.js";

const router = express.Router();
router.get("/countries", listShippingCountries);
// Use this neutral URL in Shiprocket's webhook settings and set its x-api-key token.
router.post("/status-hook", shippingStatusWebhook);
export default router;
