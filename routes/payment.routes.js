import express from 'express';
import { createPaymentOrder } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/create', createPaymentOrder);

export default router;
