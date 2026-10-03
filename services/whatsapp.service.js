// // import twilio from 'twilio';

// // const client = twilio(
// //   process.env.TWILIO_SID,
// //   process.env.TWILIO_AUTH_TOKEN
// // );




// // export const sendWhatsAppMessage = async (order) => {
// //     console.log("Order Recieved"+order)

// //   await client.messages.create({
// //     from: 'whatsapp:+14155238886',
// //     to: `whatsapp:+91${order.phone}`,
// //     body: `
// // 📦 Order Confirmed!
// // Order: ${order.order_number}
// // Total: ₹${order.total}
// // Tracking will be shared soon.
// // `
// //   });
// // };


// // import twilio from 'twilio';

// // const client = twilio(
// //   process.env.TWILIO_SID,
// //   process.env.TWILIO_AUTH_TOKEN
// // );

// // export const sendWhatsAppMessage = async (order) => {
// //   try {
// //     // const message = await client.messages.create({
// //     //   from: 'whatsapp:+14155238886', // Sandbox or your approved number
// //     //   to: `whatsapp:+91${order.phone}`,
// //     //   contentSid: process.env.TWILIO_CONTENT_SID, // Store in .env
// //     //   contentVariables: JSON.stringify({
// //     //     1: order.phone,
// //     //     2: order.total
// //     //   })
// //     // });

// //     const message = await client.messages.create({
// //   from: 'whatsapp:+14155238886',
// //   to: `whatsapp:+91${order.phone}`,
// //   body: `Order ${order.order_number} confirmed. Total ₹${order.total}`
// // });

// //     // console.log('WhatsApp sent:', message.sid);
// //     console.log('WhatsApp sent:', message);

// //   } catch (error) {
// //     console.error('WhatsApp Error:', error.message);
// //   }
// // };



// // import axios from "axios";
// // import { formatReadingAge } from "../utils/readingAge.js";

// // const DEFAULT_API_URL = "https://partners.pinbot.ai/v2/messages";
// // const DEFAULT_COUNTRY_CODE = "91";

// // const cleanText = (value, fallback = "-") => {
// //   const text = String(value ?? "").trim();
// //   return (text || fallback).slice(0, 1024);
// // };

// // const titleCase = (value) => cleanText(value)
// //   .replace(/[_-]+/g, " ")
// //   .replace(/\b\w/g, (character) => character.toUpperCase());

// // const bodyParameters = (values) => values.map((value) => ({
// //   type: "text",
// //   text: cleanText(value),
// // }));

// // export const normalizeWhatsAppNumber = (phone, countryCode) => {
// //   let number = String(phone ?? "").replace(/\D/g, "");
// //   let callingCode = String(countryCode ?? process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? DEFAULT_COUNTRY_CODE)
// //     .replace(/\D/g, "");

// //   if (number.startsWith("00")) number = number.slice(2);
// //   number = number.replace(/^0+/, "");
// //   callingCode = callingCode.replace(/^0+/, "");

// //   if (!number) throw new Error("WhatsApp recipient number is missing");

// //   if (callingCode && !number.startsWith(callingCode) && number.length <= 10) {
// //     number = `${callingCode}${number}`;
// //   }

// //   if (!/^\d{10,15}$/.test(number)) {
// //     throw new Error("WhatsApp recipient number must contain 10 to 15 digits including country code");
// //   }

// //   return number;
// // };

// // const getConfig = () => {
// //   const apiKey = String(process.env.WHATSAPP_API_KEY ?? "").trim();
// //   const sender = String(process.env.WHATSAPP_SENDER ?? "").replace(/\D/g, "");
// //   if (!apiKey || !sender) {
// //     throw new Error("WHATSAPP_API_KEY and WHATSAPP_SENDER are required");
// //   }

// //   return {
// //     apiKey,
// //     sender,
// //     apiUrl: String(process.env.WHATSAPP_API_URL || DEFAULT_API_URL).trim(),
// //     language: String(process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en").trim(),
// //     timeout: Math.max(1000, Number(process.env.WHATSAPP_TIMEOUT_MS) || 10000),
// //   };
// // };

// // const providerError = (response) => {
// //   const data = response?.data;
// //   if (response?.status < 200 || response?.status >= 300) {
// //     return data?.message || `WhatsApp provider returned HTTP ${response?.status}`;
// //   }
// //   if (String(data?.status || "").toLowerCase() === "failed" || data?.code === "100") {
// //     return data?.message || "WhatsApp provider rejected the request";
// //   }
// //   if (!data?.messages?.[0]?.id) {
// //     return data?.message || "WhatsApp provider did not return a message ID";
// //   }
// //   return null;
// // };

// // export const sendWhatsAppTemplate = async ({ to, countryCode, templateName, parameters, components = [] }) => {
// //   const config = getConfig();
// //   if (!templateName) throw new Error("WhatsApp template name is missing");

// //   const payload = {
// //     messaging_product: "whatsapp",
// //     recipient_type: "individual",
// //     to: normalizeWhatsAppNumber(to, countryCode),
// //     type: "template",
// //     template: {
// //       name: templateName,
// //       language: { code: config.language },
// //       components: [
// //         { type: "body", parameters: bodyParameters(parameters) },
// //         ...components,
// //       ],
// //     },
// //   };

// //   let response;
// //   try {
// //     response = await axios.post(config.apiUrl, payload, {
// //       headers: {
// //         "Content-Type": "application/json",
// //         apikey: config.apiKey,
// //         wanumber: config.sender,
// //       },
// //       timeout: config.timeout,
// //       validateStatus: () => true,
// //     });
// //   } catch (error) {
// //     throw new Error(error.code === "ECONNABORTED"
// //       ? "WhatsApp provider request timed out"
// //       : `WhatsApp provider request failed: ${error.message}`);
// //   }

// //   const errorMessage = providerError(response);
// //   if (errorMessage) throw new Error(errorMessage);

// //   return {
// //     sent: true,
// //     messageId: response.data.messages[0].id,
// //     recipient: response.data.contacts?.[0]?.wa_id || payload.to,
// //     template: templateName,
// //   };
// // };

// // const amountText = (value) => {
// //   const amount = Number(value);
// //   return Number.isFinite(amount) ? amount.toFixed(2) : cleanText(value);
// // };

// // export const sendOrderConfirmationWhatsApp = async (order) => {
// //   const components = [];
// //   const buttonIndex = String(process.env.WHATSAPP_ORDER_TRACK_BUTTON_INDEX ?? "").trim();
// //   if (/^\d+$/.test(buttonIndex)) {
// //     components.push({
// //       type: "button",
// //       sub_type: "url",
// //       index: buttonIndex,
// //       parameters: [{ type: "text", text: cleanText(order.order_number) }],
// //     });
// //   }

// //   return sendWhatsAppTemplate({
// //     to: order.phone,
// //     countryCode: order.whatsapp_country_code,
// //     templateName: process.env.WHATSAPP_ORDER_TEMPLATE_NAME || "order_confirmed_1",
// //     parameters: [
// //       order.customer_name || order.name || "Customer",
// //       order.order_number,
// //       order.currency || "INR",
// //       amountText(order.total),
// //       titleCase(order.payment_status || "paid"),
// //       order.estimated_delivery_days || "We will update you shortly",
// //     ],
// //     components,
// //   });
// // };

// // export const sendReadingTestResultWhatsApp = async ({
// //   countryCode,
// //   whatsappNumber,
// //   studentName,
// //   readingAge,
// //   classification,
// //   correctCount,
// //   incorrectCount,
// //   assessmentNumber,
// //   parentName,
// // }) => {
// //   const attempted = Number(correctCount || 0) + Number(incorrectCount || 0);
// //   const score = attempted ? `${Math.round((Number(correctCount || 0) / attempted) * 100)}%` : "0%";
// //   const formattedReadingAge = readingAge === "B4" ? "Below 4 years" : formatReadingAge(readingAge);
// //   const components = [];

// //   if (String(process.env.WHATSAPP_READING_QUICK_REPLIES || "true").toLowerCase() === "true") {
// //     components.push(
// //       {
// //         type: "button",
// //         sub_type: "quick_reply",
// //         index: "0",
// //         parameters: [{ type: "payload", payload: `reading_connect_${assessmentNumber}`.slice(0, 128) }],
// //       },
// //       {
// //         type: "button",
// //         sub_type: "quick_reply",
// //         index: "1",
// //         parameters: [{ type: "payload", payload: `reading_decline_${assessmentNumber}`.slice(0, 128) }],
// //       },
// //     );
// //   }

// //   return sendWhatsAppTemplate({
// //     to: whatsappNumber,
// //     countryCode,
// //     templateName: process.env.WHATSAPP_READING_TEMPLATE_NAME || "reading_test_result",
// //     parameters: [
// //       parentName || "Parent/Guardian",
// //       studentName,
// //       formattedReadingAge,
// //       score,
// //       classification,
// //     ],
// //     components,
// //   });
// // };

// // // Backward-compatible export for any existing imports.
// // export const sendWhatsAppMessage = sendOrderConfirmationWhatsApp;



// import axios from "axios";

// const DEFAULT_API_BASE_URL = "https://partnersv1.pinbot.ai/v3";
// const DEFAULT_COUNTRY_CODE = "91";

// const cleanText = (value, fallback = "-") => {
//   const text = String(value ?? "").trim();
//   return (text || fallback).slice(0, 1024);
// };

// const titleCase = (value) => cleanText(value)
//   .replace(/[_-]+/g, " ")
//   .replace(/\b\w/g, (character) => character.toUpperCase());

// const bodyParameters = (values) => values.map((value) => ({
//   type: "text",
//   text: cleanText(value),
// }));

// export const normalizeWhatsAppNumber = (phone, countryCode) => {
//   let number = String(phone ?? "").replace(/\D/g, "");
//   let callingCode = String(countryCode ?? process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? DEFAULT_COUNTRY_CODE)
//     .replace(/\D/g, "");

//   if (number.startsWith("00")) number = number.slice(2);
//   number = number.replace(/^0+/, "");
//   callingCode = callingCode.replace(/^0+/, "");

//   if (!number) throw new Error("WhatsApp recipient number is missing");

//   if (callingCode && !number.startsWith(callingCode) && number.length <= 10) {
//     number = `${callingCode}${number}`;
//   }

//   if (!/^\d{10,15}$/.test(number)) {
//     throw new Error("WhatsApp recipient number must contain 10 to 15 digits including country code");
//   }

//   return number;
// };

// const getConfig = () => {
//   const apiKey = String(process.env.WHATSAPP_API_KEY ?? "").trim();
//   const sender = String(process.env.WHATSAPP_SENDER ?? "").trim();
//   const phoneNumberId = String(process.env.WHATSAPP_PHONE_NUMBER_ID ?? "").replace(/\D/g, "");
//   if (!apiKey || !sender) {
//     throw new Error("WHATSAPP_API_KEY and WHATSAPP_SENDER are required");
//   }
//   if (!/^\+?\d{10,15}$/.test(sender.replace(/\s/g, ""))) {
//     throw new Error("WHATSAPP_SENDER must be the WABA number, with an optional leading +");
//   }

//   const configuredApiUrl = String(process.env.WHATSAPP_API_URL || "").trim();
//   const apiUrl = configuredApiUrl || (phoneNumberId
//     ? `${DEFAULT_API_BASE_URL}/${phoneNumberId}/messages`
//     : "");
//   if (!apiUrl) {
//     throw new Error("WHATSAPP_API_URL or WHATSAPP_PHONE_NUMBER_ID is required");
//   }

//   return {
//     apiKey,
//     sender: sender.replace(/\s/g, ""),
//     apiUrl,
//     language: String(process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en").trim(),
//     timeout: Math.max(1000, Number(process.env.WHATSAPP_TIMEOUT_MS) || 10000),
//   };
// };

// const providerError = (response) => {
//   const data = response?.data;
//   const providerMessage = data?.message
//     || data?.error?.message
//     || data?.errors?.[0]?.message
//     || data?.data?.message;
//   if (response?.status < 200 || response?.status >= 300) {
//     return providerMessage || `WhatsApp provider returned HTTP ${response?.status}`;
//   }
//   if (String(data?.status || "").toLowerCase() === "failed" || data?.code === "100") {
//     return providerMessage || `WhatsApp provider rejected the request: ${JSON.stringify(data)}`;
//   }
//   if (!data?.messages?.[0]?.id) {
//     return data?.message || "WhatsApp provider did not return a message ID";
//   }
//   return null;
// };

// export const sendWhatsAppTemplate = async ({ to, countryCode, templateName, parameters, components = [] }) => {
//   const config = getConfig();
//   if (!templateName) throw new Error("WhatsApp template name is missing");

//   const payload = {
//     messaging_product: "whatsapp",
//     recipient_type: "individual",
//     to: normalizeWhatsAppNumber(to, countryCode),
//     type: "template",
//     template: {
//       name: templateName,
//       language: { code: config.language },
//       components: [
//         { type: "body", parameters: bodyParameters(parameters) },
//         ...components,
//       ],
//     },
//   };

//   let response;
//   try {
//     response = await axios.post(config.apiUrl, payload, {
//       headers: {
//         "Content-Type": "application/json",
//         apikey: config.apiKey,
//         Wanumber: config.sender,
//       },
//       timeout: config.timeout,
//       validateStatus: () => true,
//     });
//   } catch (error) {
//     throw new Error(error.code === "ECONNABORTED"
//       ? "WhatsApp provider request timed out"
//       : `WhatsApp provider request failed: ${error.message}`);
//   }

//   const errorMessage = providerError(response);
//   if (errorMessage) {
//     console.error("WHATSAPP PROVIDER RESPONSE", response.status, JSON.stringify(response.data));
//     throw new Error(errorMessage);
//   }

//   return {
//     sent: true,
//     messageId: response.data.messages[0].id,
//     recipient: response.data.contacts?.[0]?.wa_id || payload.to,
//     template: templateName,
//   };
// };

// const amountText = (value) => {
//   const amount = Number(value);
//   return Number.isFinite(amount) ? amount.toFixed(2) : cleanText(value);
// };

// export const sendOrderConfirmationWhatsApp = async (order) => {
//   const components = [];
//   const buttonIndex = String(process.env.WHATSAPP_ORDER_TRACK_BUTTON_INDEX ?? "").trim();
//   if (/^\d+$/.test(buttonIndex)) {
//     components.push({
//       type: "button",
//       sub_type: "url",
//       index: buttonIndex,
//       parameters: [{ type: "text", text: cleanText(order.order_number) }],
//     });
//   }

//   return sendWhatsAppTemplate({
//     to: order.phone,
//     countryCode: order.whatsapp_country_code,
//     templateName: process.env.WHATSAPP_ORDER_TEMPLATE_NAME || "order_confirmed_1",
//     parameters: [
//       order.customer_name || order.name || "Customer",
//       order.order_number,
//       order.currency || "INR",
//       amountText(order.total),
//       titleCase(order.payment_status || "paid"),
//       order.estimated_delivery_days || "We will update you shortly",
//     ],
//     components,
//   });
// };

// export const sendReadingTestResultWhatsApp = async ({
//   countryCode,
//   whatsappNumber,
//   studentName,
//   classification,
//   correctCount,
//   incorrectCount,
//   assessmentNumber,
// }) => {
//   const attempted = Number(correctCount || 0) + Number(incorrectCount || 0);
//   const score = attempted ? String(Math.round((Number(correctCount || 0) / attempted) * 100)) : "0";
//   const completedDate = new Intl.DateTimeFormat("en-GB", {
//     timeZone: "Asia/Kolkata",
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//   }).format(new Date()).replaceAll("/", "-");
//   const components = [];

//   if (String(process.env.WHATSAPP_READING_QUICK_REPLIES || "false").toLowerCase() === "true") {
//     components.push(
//       {
//         type: "button",
//         sub_type: "quick_reply",
//         index: "0",
//         parameters: [{ type: "payload", payload: `reading_connect_${assessmentNumber}`.slice(0, 128) }],
//       },
//       {
//         type: "button",
//         sub_type: "quick_reply",
//         index: "1",
//         parameters: [{ type: "payload", payload: `reading_decline_${assessmentNumber}`.slice(0, 128) }],
//       },
//     );
//   }

//   return sendWhatsAppTemplate({
//     to: whatsappNumber,
//     countryCode,
//     templateName: process.env.WHATSAPP_READING_TEMPLATE_NAME || "reading_test_result",
//     parameters: [
//       studentName,
//       process.env.WHATSAPP_READING_TEST_NAME || "English Reading Test",
//       score,
//       classification || "Completed",
//       completedDate,
//     ],
//     components,
//   });
// };

// // Backward-compatible export for any existing imports.
// export const sendWhatsAppMessage = sendOrderConfirmationWhatsApp;


import axios from "axios";
import { formatReadingAge } from "../utils/readingAge.js";

const DEFAULT_API_BASE_URL = "https://partnersv1.pinbot.ai/v3";
const DEFAULT_COUNTRY_CODE = "91";

const cleanText = (value, fallback = "-") => {
  const text = String(value ?? "").trim();
  return (text || fallback).slice(0, 1024);
};

const titleCase = (value) => cleanText(value)
  .replace(/[_-]+/g, " ")
  .replace(/\b\w/g, (character) => character.toUpperCase());

const bodyParameters = (values) => values.map((value) => ({
  type: "text",
  text: cleanText(value),
}));

export const normalizeWhatsAppNumber = (phone, countryCode) => {
  let number = String(phone ?? "").replace(/\D/g, "");
  let callingCode = String(countryCode ?? process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? DEFAULT_COUNTRY_CODE)
    .replace(/\D/g, "");

  if (number.startsWith("00")) number = number.slice(2);
  number = number.replace(/^0+/, "");
  callingCode = callingCode.replace(/^0+/, "");

  if (!number) throw new Error("WhatsApp recipient number is missing");

  if (callingCode && !number.startsWith(callingCode) && number.length <= 10) {
    number = `${callingCode}${number}`;
  }

  if (!/^\d{10,15}$/.test(number)) {
    throw new Error("WhatsApp recipient number must contain 10 to 15 digits including country code");
  }

  return number;
};

const getConfig = () => {
  const apiKey = String(process.env.WHATSAPP_API_KEY ?? "").trim();
  const sender = String(process.env.WHATSAPP_SENDER ?? "").trim();
  const phoneNumberId = String(process.env.WHATSAPP_PHONE_NUMBER_ID ?? "").replace(/\D/g, "");
  if (!apiKey || !sender) {
    throw new Error("WHATSAPP_API_KEY and WHATSAPP_SENDER are required");
  }
  if (!/^\+?\d{10,15}$/.test(sender.replace(/\s/g, ""))) {
    throw new Error("WHATSAPP_SENDER must be the WABA number, with an optional leading +");
  }

  const configuredApiUrl = String(process.env.WHATSAPP_API_URL || "").trim();
  const apiUrl = configuredApiUrl || (phoneNumberId
    ? `${DEFAULT_API_BASE_URL}/${phoneNumberId}/messages`
    : "");
  if (!apiUrl) {
    throw new Error("WHATSAPP_API_URL or WHATSAPP_PHONE_NUMBER_ID is required");
  }

  return {
    apiKey,
    sender: sender.replace(/\s/g, ""),
    apiUrl,
    language: String(process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en").trim(),
    timeout: Math.max(1000, Number(process.env.WHATSAPP_TIMEOUT_MS) || 10000),
  };
};

const providerError = (response) => {
  const data = response?.data;
  const providerMessage = data?.message
    || data?.error?.message
    || data?.errors?.[0]?.message
    || data?.data?.message;
  if (response?.status < 200 || response?.status >= 300) {
    return providerMessage || `WhatsApp provider returned HTTP ${response?.status}`;
  }
  if (String(data?.status || "").toLowerCase() === "failed" || data?.code === "100") {
    return providerMessage || `WhatsApp provider rejected the request: ${JSON.stringify(data)}`;
  }
  if (!data?.messages?.[0]?.id) {
    return data?.message || "WhatsApp provider did not return a message ID";
  }
  return null;
};

export const sendWhatsAppTemplate = async ({ to, countryCode, templateName, parameters, components = [] }) => {
  const config = getConfig();
  if (!templateName) throw new Error("WhatsApp template name is missing");

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizeWhatsAppNumber(to, countryCode),
    type: "template",
    template: {
      name: templateName,
      language: { code: config.language },
      components: [
        { type: "body", parameters: bodyParameters(parameters) },
        ...components,
      ],
    },
  };

  let response;
  try {
    response = await axios.post(config.apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
        Wanumber: config.sender,
      },
      timeout: config.timeout,
      validateStatus: () => true,
    });
  } catch (error) {
    throw new Error(error.code === "ECONNABORTED"
      ? "WhatsApp provider request timed out"
      : `WhatsApp provider request failed: ${error.message}`);
  }

  const errorMessage = providerError(response);
  if (errorMessage) {
    console.error("WHATSAPP PROVIDER RESPONSE", response.status, JSON.stringify(response.data));
    throw new Error(errorMessage);
  }

  return {
    sent: true,
    messageId: response.data.messages[0].id,
    recipient: response.data.contacts?.[0]?.wa_id || payload.to,
    template: templateName,
  };
};

const amountText = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : cleanText(value);
};

export const sendOrderConfirmationWhatsApp = async (order) => {
  const components = [];
  const buttonIndex = String(process.env.WHATSAPP_ORDER_TRACK_BUTTON_INDEX ?? "").trim();
  if (/^\d+$/.test(buttonIndex)) {
    components.push({
      type: "button",
      sub_type: "url",
      index: buttonIndex,
      parameters: [{ type: "text", text: cleanText(order.order_number) }],
    });
  }

  return sendWhatsAppTemplate({
    to: order.phone,
    countryCode: order.whatsapp_country_code,
    templateName: process.env.WHATSAPP_ORDER_TEMPLATE_NAME || "order_confirmed_1",
    parameters: [
      order.customer_name || order.name || "Customer",
      order.order_number,
      order.currency || "INR",
      amountText(order.total),
      titleCase(order.payment_status || "paid"),
      order.estimated_delivery_days || "We will update you shortly",
    ],
    components,
  });
};

export const sendReadingTestResultWhatsApp = async ({
  countryCode,
  whatsappNumber,
  parentName,
  studentName,
  readingAge,
  classification,
  intervention,
  assessmentNumber,
  pdfDownloadToken,
}) => {
  const formattedReadingAge = readingAge === "B4"
    ? "Below 4 years"
    : formatReadingAge(readingAge);
  const components = [];

  const pdfButtonIndex = String(process.env.WHATSAPP_READING_PDF_BUTTON_INDEX ?? "").trim();
  if (pdfDownloadToken && /^\d+$/.test(pdfButtonIndex)) {
    components.push({
      type: "button",
      sub_type: "url",
      index: pdfButtonIndex,
      parameters: [{ type: "text", text: cleanText(pdfDownloadToken) }],
    });
  }

  if (String(process.env.WHATSAPP_READING_QUICK_REPLIES || "false").toLowerCase() === "true") {
    components.push(
      {
        type: "button",
        sub_type: "quick_reply",
        index: "0",
        parameters: [{ type: "payload", payload: `reading_connect_${assessmentNumber}`.slice(0, 128) }],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: "1",
        parameters: [{ type: "payload", payload: `reading_decline_${assessmentNumber}`.slice(0, 128) }],
      },
    );
  }

  return sendWhatsAppTemplate({
    to: whatsappNumber,
    countryCode,
    templateName: process.env.WHATSAPP_READING_TEMPLATE_NAME || "reading_test_result",
    parameters: [
      parentName || "Parent/Guardian",
      studentName,
      formattedReadingAge,
      classification || "Completed",
      intervention || "Assessment-based reading support",
    ],
    components,
  });
};

// Backward-compatible export for any existing imports.
export const sendWhatsAppMessage = sendOrderConfirmationWhatsApp;

