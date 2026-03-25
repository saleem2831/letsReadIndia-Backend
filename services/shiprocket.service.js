// import axios from "axios";

// let shiprocketToken = null;

// // 🔐 LOGIN
// async function authenticate() {
//   if (shiprocketToken) return shiprocketToken;

//   const res = await axios.post(
//     "https://apiv2.shiprocket.in/v1/external/auth/login",
//     {
//       email: process.env.SHIPROCKET_EMAIL,
//       password: process.env.SHIPROCKET_PASSWORD,
//     }
//   );

//   shiprocketToken = res.data.token;
//   return shiprocketToken;
// }

// // 📦 CREATE ORDER


// export async function createShiprocketOrder(order, items, dimensions) {
//   const token = await authenticate();

//   const nameParts = order.customer_name.split(" ");

//   const orderPayload = {
//     order_id: order.order_number,
//     order_date: new Date().toISOString().split("T")[0],

//     pickup_location: "warehouse",

//     // 👇 MUST SEND ALL THREE
//     billing_customer_name: order.customer_name,
//     billing_first_name: nameParts[0],
//     billing_last_name: nameParts.slice(1).join(" ") || "NA",

//     billing_address: order.address,
//     billing_city: "Pune",
//     billing_pincode: order.pincode,
//     billing_state: "Maharashtra",
//     billing_country: "India",

//     billing_email: order.email,
//     billing_phone: order.phone,

//     shipping_is_billing: true,

//     order_items: items.map((i) => ({
//       name: i.name,
//       sku: `SKU-${i.product_id}`,
//       units: i.quantity,
//       selling_price: i.price,
//     })),

//     payment_method: "Prepaid",
//     sub_total: order.total,

//     length: dimensions.length,
//     breadth: dimensions.breadth,
//     height: dimensions.height,
//     weight: dimensions.weight,
//   };

//   const res = await axios.post(
//     "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
//     orderPayload,
//     {
//       headers: { Authorization: `Bearer ${token}` },
//     }
//   );

//   return res.data;
// }


// // 🚚 CHECK SERVICEABILITY
// export async function checkServiceability(pincodeFrom, pincodeTo, weight) {
//   const token = await authenticate();

//   const res = await axios.get(
//     `https://apiv2.shiprocket.in/v1/external/courier/serviceability`,
//     {
//       params: {
//         pickup_postcode: pincodeFrom,
//         delivery_postcode: pincodeTo,
//         weight,
//         cod: 0,
//       },
//       headers: { Authorization: `Bearer ${token}` },
//     }
//   );

//   return res.data;
// }

// // 📄 ASSIGN AWB
// export async function assignAWB(shipment_id, courier_id) {
//   const token = await authenticate();

//   const res = await axios.post(
//     "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
//     {
//       shipment_id,
//       courier_id,
//     },
//     {
//       headers: { Authorization: `Bearer ${token}` },
//     }
//   );

//   return res.data;
// }


import axios from "axios";

let shiprocketToken = null;
let tokenExpiry = null;

/* =========================================
   🔐 AUTHENTICATE (AUTO TOKEN REFRESH)
========================================= */
async function authenticate() {
  if (shiprocketToken && tokenExpiry && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }

  try {
    const res = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
    );

    shiprocketToken = res.data.token;

    // Token valid for 240 minutes → set expiry buffer
    tokenExpiry = Date.now() + 230 * 60 * 1000;

    return shiprocketToken;
  } catch (err) {
    console.error("❌ Shiprocket Auth Error:", err.response?.data || err.message);
    throw new Error("Shiprocket authentication failed");
  }
}

/* =========================================
   📦 CREATE ORDER
========================================= */
export async function createShiprocketOrder(order, items, dimensions) {
  const token = await authenticate();

  const nameParts = order.customer_name.split(" ");

  const orderPayload = {
    order_id: order.order_number,
    order_date: new Date().toISOString().split("T")[0],

    pickup_location: "warehouse",

    billing_customer_name: order.customer_name,
    billing_first_name: nameParts[0],
    billing_last_name: nameParts.slice(1).join(" ") || "NA",

    billing_address: order.address,
    billing_city: order.city || "Pune",
    billing_pincode: order.pincode,
    billing_state: order.state || "Maharashtra",
    billing_country: "India",

    billing_email: order.email,
    billing_phone: order.phone,

    shipping_is_billing: true,

    order_items: items.map((i) => ({
      name: i.name,
      sku: `SKU-${i.product_id}`,
      units: i.quantity,
      selling_price: i.price,
    })),

    payment_method: "Prepaid",
    sub_total: order.total,

    length: dimensions.length,
    breadth: dimensions.breadth,
    height: dimensions.height,
    weight: dimensions.weight,
  };

  try {
    const res = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      orderPayload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res.data;
  } catch (err) {
    console.error("❌ Shiprocket Order Error:", err.response?.data || err.message);
    throw err;
  }
}

/* =========================================
   🚚 CHECK SERVICEABILITY
========================================= */
export async function checkServiceability(pincodeFrom, pincodeTo, weight) {
  const token = await authenticate();

  try {
    const res = await axios.get(
      "https://apiv2.shiprocket.in/v1/external/courier/serviceability",
      {
        params: {
          pickup_postcode: pincodeFrom,
          delivery_postcode: pincodeTo,
          weight,
          cod: 0,
        },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return res.data;
  } catch (err) {
    console.error("❌ Serviceability Error:", err.response?.data || err.message);
    throw err;
  }
}

/* =========================================
   📄 ASSIGN AWB
========================================= */
export async function assignAWB(shipment_id, courier_id) {
  const token = await authenticate();

  try {
    const res = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
      {
        shipment_id,
        courier_id,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ AWB RESPONSE:", res.data);

    return res.data;
  } catch (err) {
    console.error("❌ AWB Error:", err.response?.data || err.message);
    throw err;
  }
}

/* =========================================
   🚛 GENERATE PICKUP (AUTO COURIER COMES)
========================================= */
export async function generatePickup(shipmentId) {
  const token = await authenticate();

  try {
    const res = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/courier/generate/pickup",
      {
        shipment_id: [shipmentId],
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("🚛 Pickup Generated:", res.data);

    return res.data;
  } catch (err) {
    console.error("❌ Pickup Error:", err.response?.data || err.message);
    throw err;
  }
}
