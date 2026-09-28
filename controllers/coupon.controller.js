import { db } from "../config/db.js";

const normalize = (value) => String(value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 50);
const nullableNumber = (value) => value === "" || value === null || value === undefined ? null : Number(value);
const nullableDate = (value) => value ? new Date(value) : null;

const couponValues = (body, userId) => {
  const code = normalize(body.code);
  const type = body.discount_type;
  const value = Number(body.discount_value);
  if (!code || !["percent", "fixed"].includes(type) || !(value > 0)) {
    throw new Error("Code, discount type and a positive value are required");
  }
  if (type === "percent" && value > 100) throw new Error("Percentage cannot exceed 100");
  return [code, String(body.description || "").trim().slice(0, 255) || null, type, value,
    Math.max(0, Number(body.minimum_order) || 0), nullableNumber(body.maximum_discount),
    nullableNumber(body.maximum_uses), nullableNumber(body.uses_per_email), nullableDate(body.starts_at),
    nullableDate(body.expires_at), body.is_active === false ? 0 : 1, userId || null];
};

export const listCoupons = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*,COUNT(r.id) AS uses FROM coupons c LEFT JOIN coupon_redemptions r ON r.coupon_id=c.id
       WHERE c.deleted_at IS NULL GROUP BY c.id ORDER BY c.created_at DESC`,
    );
    res.json({ data: rows });
  } catch (error) { res.status(500).json({ message: "Unable to load coupons" }); }
};

export const createCoupon = async (req, res) => {
  try {
    const values = couponValues(req.body, req.user?.id);
    const [result] = await db.query(
      `INSERT INTO coupons (code,description,discount_type,discount_value,minimum_order,maximum_discount,
       maximum_uses,uses_per_email,starts_at,expires_at,is_active,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, values,
    );
    res.status(201).json({ message: "Coupon created", id: result.insertId });
  } catch (error) {
    res.status(error.code === "ER_DUP_ENTRY" ? 409 : 400).json({ message: error.code === "ER_DUP_ENTRY" ? "Coupon code already exists" : error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const values = couponValues(req.body, req.user?.id);
    values.pop();
    const [result] = await db.query(
      `UPDATE coupons SET code=?,description=?,discount_type=?,discount_value=?,minimum_order=?,maximum_discount=?,
       maximum_uses=?,uses_per_email=?,starts_at=?,expires_at=?,is_active=? WHERE id=? AND deleted_at IS NULL`, [...values, req.params.id],
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon updated" });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const setCouponStatus = async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE coupons SET is_active=? WHERE id=? AND deleted_at IS NULL",
      [req.body.is_active ? 1 : 0, req.params.id],
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon status updated" });
  } catch { res.status(500).json({ message: "Unable to update coupon" }); }
};

export const deleteCoupon = async (req, res) => {
  try {
    const [[usage]] = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM coupon_redemptions WHERE coupon_id=?) redemptions,
        (SELECT COUNT(*) FROM checkout_quotes WHERE coupon_id=?) quotes,
        (SELECT COUNT(*) FROM orders WHERE coupon_id=?) orders_count`,
      [req.params.id, req.params.id, req.params.id],
    );
    if (Number(usage.redemptions) || Number(usage.quotes) || Number(usage.orders_count)) {
      const [result] = await db.query(
        `UPDATE coupons
         SET is_active=0,deleted_at=NOW(),
             code=CONCAT(LEFT(code,8),'__REMOVED_',id,'_',UNIX_TIMESTAMP())
         WHERE id=? AND deleted_at IS NULL`,
        [req.params.id],
      );
      if (!result.affectedRows) return res.status(404).json({ message: "Coupon not found" });
      return res.json({
        message: "Coupon removed. Existing checkout and order history was preserved.",
        archived: true,
      });
    }
    const [result] = await db.query("DELETE FROM coupons WHERE id=?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Coupon not found" });
    return res.json({ message: "Coupon deleted" });
  } catch (error) {
    console.error("COUPON DELETE ERROR", error);
    return res.status(500).json({ message: "Unable to delete coupon" });
  }
};
