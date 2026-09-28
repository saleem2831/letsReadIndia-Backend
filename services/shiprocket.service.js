import axios from "axios";

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";
let token;
let tokenExpiresAt = 0;

const validHsn = (value) => {
  const normalized = String(value ?? "").trim().replace(/\s+/g, "");
  return /^\d{1,15}$/.test(normalized) ? normalized : "";
};

const authenticate = async () => {
  if (token && Date.now() < tokenExpiresAt) return token;
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) throw new Error("Shiprocket credentials are not configured");
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD,
  }, { timeout: 15000 });
  token = response.data.token;
  tokenExpiresAt = Date.now() + (230 * 60 * 1000);
  return token;
};

const request = async (config) => axios({
  baseURL: BASE_URL, timeout: 20000, ...config,
  headers: { ...(config.headers || {}), Authorization: `Bearer ${await authenticate()}` },
});

const cheapest = (couriers, international) => (Array.isArray(couriers) ? couriers : []).map((courier) => ({
  raw: courier,
  id: String(courier.courier_company_id ?? courier.courier_id ?? courier.id ?? ""),
  name: courier.courier_name || courier.name || "Shiprocket courier",
  charge: Number(international ? (courier.rate?.total ?? courier.rate?.rate ?? courier.rate) : (courier.freight_charge ?? courier.rate)),
  etd: String(courier.estimated_delivery_days ?? courier.etd ?? ""),
})).filter((courier) => Number.isFinite(courier.charge) && courier.charge >= 0)
  .sort((a, b) => a.charge - b.charge)[0];

export const getShippingQuote = async ({ countryCode, pincode, weight, declaredValue }) => {
  const international = String(countryCode || "IN").toUpperCase() !== "IN";
  try {
    const response = await request({
      method: "get",
      url: international ? "/international/courier/serviceability" : "/courier/serviceability/",
      params: international ? {
        weight: Math.max(0.1, weight), cod: 0, delivery_country: String(countryCode).toUpperCase(),
        delivery_postcode: pincode, pickup_postcode: process.env.SHIPROCKET_PICKUP_POSTCODE,
        declared_value: Math.max(1, Number(declaredValue) || 1),
      } : {
        pickup_postcode: process.env.SHIPROCKET_PICKUP_POSTCODE,
        delivery_postcode: pincode, weight: Math.max(0.1, weight), cod: 0, declared_value: declaredValue,
      },
    });
    const data = response.data?.data || response.data;
    const courierRows = Array.isArray(data)
      ? data
      : data?.available_courier_companies || data?.available_courier_company
        || data?.couriers || data?.rates || [];
    const selected = cheapest(courierRows, international);
    if (!selected) throw new Error("No courier service is available for this address");
    return { mode: international ? "international" : "domestic", ...selected };
  } catch (error) {
    if (!international && process.env.DOMESTIC_SHIPPING_FALLBACK !== "false") {
      return { mode: "domestic", id: null, name: "Shiprocket (rate pending)",
        charge: Number(process.env.DOMESTIC_SHIPPING_FEE || 100), etd: "",
        raw: { fallback: true, reason: error.response?.data?.message || error.message } };
    }
    throw new Error(error.response?.data?.message || error.message || "Shipping quote failed");
  }
};

export const getSupportedCountries = async () => {
  const response = await request({ method: "get", url: "/countries" });
  const rows = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
  return rows.map((country) => ({ code: country.iso_code_2, name: country.name, isd_code: country.isd_code,
    postcode_required: Boolean(country.postcode_required) })).filter((country) => country.code && country.name);
};

export const checkServiceability = async (pickup, delivery, weight) => {
  const response = await request({ method: "get", url: "/courier/serviceability/", params: {
    pickup_postcode: pickup, delivery_postcode: delivery, weight, cod: 0,
  } });
  return response.data;
};

export const createShiprocketOrder = async (order, items, dimensions) => {
  const international = order.shipping_mode === "international";
  const [firstName, ...lastName] = String(order.customer_name).trim().split(/\s+/);
  const phoneDigits = String(order.phone || "").replace(/\D/g, "");
  const phone = international ? phoneDigits.slice(-15) : phoneDigits.slice(-10);
  const pickupLocation = String(process.env.SHIPROCKET_PICKUP_LOCATION || "").trim();
  if (!pickupLocation) {
    throw new Error("SHIPROCKET_PICKUP_LOCATION is missing. Add the exact active pickup-location nickname from Shiprocket to .env");
  }
  if (phone.length < 7) throw new Error("The delivery phone number is not valid for Shiprocket");

  const orderItems = items.map((item) => {
    const hsn = validHsn(item.hsn_code);
    if (international && !hsn) {
      throw new Error(`Set a numeric HSN code containing 1 to 15 digits for ${item.name}`);
    }
    return {
      name: item.name,
      sku: `SKU-${item.product_id}`,
      units: Number(item.quantity),
      selling_price: Number(item.price),
      ...(hsn ? { hsn: Number(hsn) } : {}),
    };
  });

  const payload = {
    order_id: order.order_number, order_date: new Date().toISOString().slice(0, 10),
    pickup_location: pickupLocation,
    billing_customer_name: firstName,
    billing_last_name: lastName.join(" ") || "NA", billing_address: order.address,
    billing_address_2: "",
    billing_city: order.city, billing_pincode: international ? order.pincode : Number(order.pincode), billing_state: order.state,
    billing_country: international ? order.country : "India", billing_email: order.email,
    billing_phone: phone, shipping_is_billing: true,
    order_items: orderItems,
    payment_method: "Prepaid", sub_total: Number(order.subtotal) - Number(order.discount_amount || 0),
    shipping_charges: Number(order.delivery_fee || 0), total_discount: Number(order.discount_amount || 0),
    length: dimensions.length, breadth: dimensions.breadth, height: dimensions.height, weight: dimensions.weight,
  };
  const response = await request({ method: "post",
    url: international ? "/international/orders/create/adhoc" : "/orders/create/adhoc", data: payload });
  return response.data;
};

export const assignAWB = async (shipmentId, courierId, international = false) => {
  const response = await request({ method: "post",
    url: international ? "/international/courier/assign/awb" : "/courier/assign/awb",
    data: { shipment_id: shipmentId, ...(courierId ? { courier_id: courierId } : {}) } });
  return response.data;
};

export const generatePickup = async (shipmentId) => {
  const response = await request({ method: "post", url: "/courier/generate/pickup", data: { shipment_id: [shipmentId] } });
  return response.data;
};
