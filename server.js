import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import orderRoutes from './routes/order.routes.js';
import productRoutes from './routes/product.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import customerRoutes from './routes/customer.routes.js';

import formsRoutes from "./routes/forms.routes.js";


import path from 'path';



dotenv.config();

const app = express();


// ✅ SINGLE CORS CONFIG (ONLY THIS)
app.use(cors({
  origin: [
    "https://letsreadindia.in"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
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


app.get('/', (_, res) => res.send('Backend running'));

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
