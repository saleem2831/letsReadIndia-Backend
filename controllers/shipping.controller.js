import { db } from "../config/db.js";
import { getSupportedCountries } from "../services/shiprocket.service.js";
import { notifyOrderChanged } from "../utils/realtime.js";

let countriesCache = { expires: 0, data: [] };
export const listShippingCountries = async (_req, res) => {
  try {
    if (Date.now() > countriesCache.expires) countriesCache = { data: await getSupportedCountries(), expires: Date.now() + 86400000 };
    res.json({ data: countriesCache.data });
  } catch (error) {
    res.status(503).json({ message: "Shipping countries are temporarily unavailable" });
  }
};

export const shippingStatusWebhook = async (req, res) => {
  try {
    const configuredToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (configuredToken && req.get("x-api-key") !== configuredToken) return res.sendStatus(401);
    const awb = String(req.body.awb || req.body.awb_code || "").trim();
    const shipmentId = req.body.shipment_id;
    const currentStatus = String(req.body.current_status || req.body.shipment_status || "Update").trim();
    const [[order]] = await db.query(
      "SELECT id FROM orders WHERE waybill=? OR shipment_id=? LIMIT 1", [awb || "__none__", shipmentId || "__none__"],
    );
    if (!order) return res.sendStatus(202);
    const delivered = currentStatus.toLowerCase().includes("delivered");
    await db.query(
      `UPDATE orders SET shipment_status=?,courier_name=COALESCE(?,courier_name),
       status=IF(?,\'delivered\',status),delivered_at=IF(?,COALESCE(delivered_at,NOW()),delivered_at) WHERE id=?`,
      [currentStatus, req.body.courier_name || null, delivered ? 1 : 0, delivered ? 1 : 0, order.id],
    );
    const scan = Array.isArray(req.body.scans) ? req.body.scans.at(-1) : null;
    await db.query(
      `INSERT INTO shipment_events (order_id,awb,shipment_status,activity,location,event_time,raw_payload)
       VALUES (?,?,?,?,?,?,?)`,
      [order.id, awb || null, currentStatus, scan?.activity || req.body.activity || null,
        scan?.location || req.body.location || null, scan?.date || req.body.event_time || null, JSON.stringify(req.body)],
    );
    await notifyOrderChanged(order.id, delivered ? "delivered" : "shipment_status");
    res.sendStatus(200);
  } catch (error) {
    console.error("SHIPPING WEBHOOK ERROR", error);
    res.sendStatus(500);
  }
};
