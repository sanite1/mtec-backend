// routes/payment.routes.ts
import express from "express";
import {
  getPaymentStatsController,
  getPayments,
  initializePayment,
  paystackWebhook,
  withdrawBalance,
} from "../controllers/payment.controller";
import {
  getPaymentStatsValidation,
  getPaymentValidation,
  initializePaymentValidation,
  withdrawValidation,
} from "../validations/payment.validation";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";

const router = express.Router();

router.route("/initialize/:orderId").post(
  // isAuthenticated,
  initializePaymentValidation(),
  initializePayment
);

router
  .route("/withdraw/:userId")
  .post(isAuthenticated, withdrawValidation(), withdrawBalance);

router
  .route("/:userId")
  .get(isAuthenticated, getPaymentValidation(), getPayments);

router
  .route("/stats/:userId")
  .get(isAuthenticated, getPaymentStatsValidation(), getPaymentStatsController);

router.post("/webhook/paystack", paystackWebhook);

export default router;
