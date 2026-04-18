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


const allowedOrigins = [
  'http://localhost:5173',
  'http://letsreadindia.in',
  'https://letsreadindia.in'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // if you're using cookies/auth headers
  })
);



app.use(cors());
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
