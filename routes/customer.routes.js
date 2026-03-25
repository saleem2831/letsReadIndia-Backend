import express from "express";
import {
  getCustomerOrderByNumber,
  downloadInvoiceByOrderNumber,
  requestReturn,
  getCustomerOrderDetails
} from "../controllers/customer.controller.js";



const router = express.Router();

/* Public tracking */
router.get("/order/:orderNumber", getCustomerOrderByNumber);

/* Public invoice */
router.get("/order/:orderNumber/invoice", downloadInvoiceByOrderNumber);
router.post("/return", requestReturn);

router.get("/track-order", getCustomerOrderDetails);



export default router;
