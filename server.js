import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'node:http';

import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import orderRoutes from './routes/order.routes.js';
import productRoutes from './routes/product.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import customerRoutes from './routes/customer.routes.js';

import formsRoutes from "./routes/forms.routes.js";


import path from 'path';

import galleryRoutes from './routes/gallery.routes.js';
import readingAssessmentRoutes from './routes/readingAssessment.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import { initializeRealtime } from './utils/realtime.js';



dotenv.config();

const app = express();


// ✅ SINGLE CORS CONFIG (ONLY THIS)
app.use(cors({
  origin: [
      "https://letsreadindia.in",
      "https://www.letsreadindia.in",
      "http://localhost:5173",
      // "http://localhost:5173/products"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  credentials: true
}));



// ✅ HANDLE PREFLIGHT (IMPORTANT)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
//app.use('/uploads', express.static('uploads'));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/payments', paymentRoutes);


app.use('/api/customer',customerRoutes);



app.use("/api/forms", formsRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/reading-assessments", readingAssessmentRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/shipping", shippingRoutes);


app.get('/', (_, res) => res.send('Backend running'));

const server = http.createServer(app);
initializeRealtime(server);

server.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
