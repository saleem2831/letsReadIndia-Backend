// import twilio from 'twilio';

// const client = twilio(
//   process.env.TWILIO_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );




// export const sendWhatsAppMessage = async (order) => {
//     console.log("Order Recieved"+order)

//   await client.messages.create({
//     from: 'whatsapp:+14155238886',
//     to: `whatsapp:+91${order.phone}`,
//     body: `
// 📦 Order Confirmed!
// Order: ${order.order_number}
// Total: ₹${order.total}
// Tracking will be shared soon.
// `
//   });
// };


import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendWhatsAppMessage = async (order) => {
  try {
    // const message = await client.messages.create({
    //   from: 'whatsapp:+14155238886', // Sandbox or your approved number
    //   to: `whatsapp:+91${order.phone}`,
    //   contentSid: process.env.TWILIO_CONTENT_SID, // Store in .env
    //   contentVariables: JSON.stringify({
    //     1: order.phone,
    //     2: order.total
    //   })
    // });

    const message = await client.messages.create({
  from: 'whatsapp:+14155238886',
  to: `whatsapp:+91${order.phone}`,
  body: `Order ${order.order_number} confirmed. Total ₹${order.total}`
});

    // console.log('WhatsApp sent:', message.sid);
    console.log('WhatsApp sent:', message);

  } catch (error) {
    console.error('WhatsApp Error:', error.message);
  }
};



