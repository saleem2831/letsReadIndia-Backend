
import axios from 'axios';

export const createDelhiveryShipment = async (order, items) => {
  const DELHIVERY_BASE_URL = "https://track.delhivery.com";

  const payload = {
    shipments: [
      {
        name: order.customer_name,
        add: order.address,
        pin: order.pincode || "500001",
        city: order.city || "Hyderabad",
        state: order.state || "Telangana",
        country: "India",
        phone: order.phone,

        // order: order.order_number,
        order:"TEST-" + order.order_number,
        payment_mode: "Prepaid",
        cod_amount: 0,

        products_desc: items.map(i => `Product ${i.product_id}`).join(","),
        hsn_code: "6109",

        total_amount: order.total,
        quantity: items.length,
        weight: 0.5,

        order_date: new Date().toISOString().slice(0, 10),

        seller_name: process.env.DELHIVERY_SELLER_NAME,
        seller_add: process.env.DELHIVERY_PICKUP_ADDRESS,
        seller_inv: order.order_number,

        return_name: process.env.DELHIVERY_SELLER_NAME,
        return_add: process.env.DELHIVERY_PICKUP_ADDRESS,
        return_pin: process.env.DELHIVERY_PICKUP_PIN,
        return_city: process.env.DELHIVERY_PICKUP_CITY,
        return_state: process.env.DELHIVERY_PICKUP_STATE,
        return_country: "India",
        return_phone: process.env.DELHIVERY_PICKUP_PHONE
      }
    ],

    // pickup_location: {
    //   name: process.env.DELHIVERY_PICKUP_NAME
    // }
    pickup_location: process.env.DELHIVERY_PICKUP_NAME

  };

  try {
    const res = await axios.post(
      // "https://staging-express.delhivery.com/api/cmu/create.json",
      `${DELHIVERY_BASE_URL}/api/cmu/create.json`,
      payload,
      {
        headers: {
          Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
          "Content-Type": "application/json",
          Accept:"application/json"
        }
      }
    );

    console.log("DELHIVERY FULL RESPONSE:", JSON.stringify(res.data, null, 2));
    // console.log("DELHIVERY PAYLOAD:", JSON.stringify(payload, null, 2));
    console.log("Pickup Name:", process.env.DELHIVERY_PICKUP_NAME);



    return res.data;

  } catch (error) {
    console.error("DELHIVERY ERROR:", error.response?.data || error.message);
    throw error;
  }
};

