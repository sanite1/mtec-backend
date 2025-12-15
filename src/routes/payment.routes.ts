// routes/payment.routes.ts
import express from "express";
import {
  getPaymentStatsController,
  getPayments,
  initializePayment,
  paystackWebhook,
} from "../controllers/payment.controller";
import {
  getPaymentStatsValidation,
  getPaymentValidation,
  initializePaymentValidation,
} from "../validations/payment.validation";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";

const router = express.Router();

router.route("/initialize/:orderId").post(
  // isAuthenticated,
  initializePaymentValidation(),
  initializePayment
);

router
  .route("/:userId")
  .get(isAuthenticated, getPaymentValidation(), getPayments);

router
  .route("/stats/:userId")
  .get(isAuthenticated, getPaymentStatsValidation(), getPaymentStatsController);

router.post("/webhook/paystack", paystackWebhook);

export default router;
