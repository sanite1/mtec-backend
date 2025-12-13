// routes/payment.routes.ts
import express from "express";
import {
  initializePayment,
  paystackWebhook,
} from "../controllers/payment.controller";
import { initializePaymentValidation } from "../validations/payment.validation";

const router = express.Router();

router.route("/initialize/:orderId").post(
  // isAuthenticated,
  initializePaymentValidation(),
  initializePayment
);
// router.post("/initialize", initializePayment);
router.post("/webhook/paystack", paystackWebhook);

export default router;
