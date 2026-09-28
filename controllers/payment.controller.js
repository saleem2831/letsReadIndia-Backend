import crypto from "node:crypto";
import Razorpay from "razorpay";
import { db } from "../config/db.js";
import { getShippingQuote } from "../services/shiprocket.service.js";

const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const clean = (value, size) => String(value ?? "").trim().slice(0, size);

const getCoupon = async (code, subtotal, email) => {
  const normalized = clean(code, 50).toUpperCase();
  if (!normalized) return { coupon: null, discount: 0 };
  const [[coupon]] = await db.query(
    `SELECT c.*,(SELECT COUNT(*) FROM coupon_redemptions r WHERE r.coupon_id=c.id) total_uses,
      (SELECT COUNT(*) FROM coupon_redemptions r WHERE r.coupon_id=c.id AND r.customer_email=?) email_uses
     FROM coupons c WHERE c.code=? AND c.deleted_at IS NULL`, [email, normalized],
  );
  if (!coupon || !coupon.is_active) throw new Error("Coupon is invalid or inactive");
  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) throw new Error("Coupon is not active yet");
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) throw new Error("Coupon has expired");
  if (subtotal < Number(coupon.minimum_order)) throw new Error(`Minimum order for this coupon is ₹${coupon.minimum_order}`);
  if (coupon.maximum_uses !== null && Number(coupon.total_uses) >= Number(coupon.maximum_uses)) throw new Error("Coupon usage limit reached");
  if (coupon.uses_per_email !== null && Number(coupon.email_uses) >= Number(coupon.uses_per_email)) throw new Error("Coupon already used by this email");
  let discount = coupon.discount_type === "percent" ? subtotal * Number(coupon.discount_value) / 100 : Number(coupon.discount_value);
  if (coupon.maximum_discount !== null) discount = Math.min(discount, Number(coupon.maximum_discount));
  return { coupon, discount: money(Math.min(subtotal, discount)) };
};

export const createPaymentOrder = async (req, res) => {
  try {
    const customer = {
      customer_name: clean(req.body.customer?.customer_name, 150), email: clean(req.body.customer?.email, 190).toLowerCase(),
      phone: clean(req.body.customer?.phone, 30), address: clean(req.body.customer?.address, 500),
      pincode: clean(req.body.customer?.pincode, 20), city: clean(req.body.customer?.city, 100),
      state: clean(req.body.customer?.state, 100), country: clean(req.body.customer?.country, 100),
      country_code: clean(req.body.customer?.country_code, 2).toUpperCase() || "IN",
    };
    if (Object.entries(customer).some(([key, value]) => key !== "email" && !value)) {
      return res.status(400).json({ message: "Complete all delivery details" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (!/^[A-Z]{2}$/.test(customer.country_code)) {
      return res.status(400).json({ message: "Select a valid delivery country" });
    }
    if (customer.phone.replace(/\D/g, "").length < 7 || customer.phone.replace(/\D/g, "").length > 15) {
      return res.status(400).json({ message: "Enter a valid phone number with country code when applicable" });
    }
    if (customer.country_code === "IN" && !/^\d{6}$/.test(customer.pincode)) {
      return res.status(400).json({ message: "Enter a valid 6-digit Indian pincode" });
    }
    const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
    if (!requestedItems.length) return res.status(400).json({ message: "Cart is empty" });
    const ids = [...new Set(requestedItems.map((item) => Number(item.product_id)).filter(Number.isInteger))];
    if (!ids.length || ids.length !== requestedItems.length) {
      return res.status(400).json({ message: "Cart contains duplicate or invalid products" });
    }
    const [products] = await db.query(
      `SELECT id,name,price,stock,COALESCE(weight_kg,.5) weight_kg FROM products WHERE id IN (?) AND status='active'`, [ids],
    );
    const byId = new Map(products.map((product) => [Number(product.id), product]));
    const items = requestedItems.map((item) => {
      const product = byId.get(Number(item.product_id));
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 25 || product.stock < quantity) {
        throw new Error(`A cart item is unavailable or has insufficient stock`);
      }
      return { product_id: product.id, name: product.name, quantity, price: Number(product.price), weight_kg: Number(product.weight_kg) };
    });
    const subtotal = money(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const weight = items.reduce((sum, item) => sum + item.weight_kg * item.quantity, 0);
    const { coupon, discount } = await getCoupon(req.body.coupon_code, subtotal, customer.email);
    const shipping = await getShippingQuote({ countryCode: customer.country_code, pincode: customer.pincode, weight, declaredValue: subtotal - discount });
    const shippingFee = customer.country_code === "IN" && subtotal >= Number(process.env.FREE_SHIPPING_THRESHOLD || 1500)
      ? 0 : money(shipping.charge);
    const total = money(subtotal - discount + shippingFee);
    if (total <= 0) throw new Error("Order total must be positive");

    const quoteNumber = `QT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), currency: "INR", receipt: quoteNumber,
      partial_payment: false,
      notes: { shipping_mode: shipping.mode, coupon: coupon?.code || "" },
    });
    await db.query(
      `INSERT INTO checkout_quotes
       (quote_number,razorpay_order_id,customer_json,items_json,subtotal,discount_amount,shipping_fee,total,currency,
        coupon_id,coupon_code,shipping_mode,courier_id,courier_name,estimated_delivery_days,shipping_rate_json,status,expires_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'payment_created\',DATE_ADD(NOW(),INTERVAL 30 MINUTE))`,
      [quoteNumber, razorpayOrder.id, JSON.stringify(customer), JSON.stringify(items), subtotal, discount, shippingFee, total,
        "INR", coupon?.id || null, coupon?.code || null, shipping.mode, shipping.id || null, shipping.name,
        shipping.etd || null, JSON.stringify(shipping.raw || {})],
    );
    res.json({
      orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: "INR", key: process.env.RAZORPAY_KEY_ID,
      quote: { subtotal, discount, shipping_fee: shippingFee, total, coupon_code: coupon?.code || null,
        shipping_mode: shipping.mode, courier_name: shipping.name, estimated_delivery_days: shipping.etd || null },
    });
  } catch (error) {
    console.error("PAYMENT QUOTE ERROR", error.response?.data || error.message);
    res.status(/coupon|cart|stock|delivery|courier|shipping|total/i.test(error.message) ? 400 : 500)
      .json({ message: error.message || "Unable to create payment" });
  }
};
