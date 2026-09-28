import express from "express";
import { createCoupon, deleteCoupon, listCoupons, setCouponStatus, updateCoupon } from "../controllers/coupon.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { superAdminOnly } from "../middlewares/role.middleware.js";

const router = express.Router();
router.use(protect, superAdminOnly);
router.get("/", listCoupons);
router.post("/", createCoupon);
router.put("/:id", updateCoupon);
router.patch("/:id/status", setCouponStatus);
router.delete("/:id", deleteCoupon);
export default router;
