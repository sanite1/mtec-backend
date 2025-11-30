import { Router } from "express";
import {
  cancelOrderController,
  createOrder,
  getOrderByIdController,
  getOrderStatsController,
  getOrders,
  updateOrderPaymentController,
  updateOrderStatusController,
} from "../controllers/order.controller";
import {
  cancelOrderValidation,
  createOrderValidation,
  getOrderStatsValidation,
  getOrdersValidation,
  getSingleOrderValidation,
  updateOrderStatusValidation,
  updatePaymentStatusValidation,
} from "../validations/order.validation";
// optionally add isAuthenticated middleware if you want only logged-in users to create orders
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import { verifyDiscountValidation } from "../validations/discount.validation";
import { verifyDiscountController } from "../controllers/discount.controller";

const router = Router();

router.route("/user-storefront").post(createOrderValidation(), createOrder);

router
  .route("/")
  .post(isAuthenticated, createOrderValidation(), createOrder)
  .get(isAuthenticated, getOrdersValidation(), getOrders);

router
  .route("/all/:userId")
  .get(isAuthenticated, getOrdersValidation(), getOrders);

router
  .route("/:id/status")
  .patch(
    isAuthenticated,
    updateOrderStatusValidation(),
    updateOrderStatusController
  );

router
  .route("/:id/payment")
  .patch(
    isAuthenticated,
    updatePaymentStatusValidation(),
    updateOrderPaymentController
  );
router
  .route("/:id")
  .get(isAuthenticated, getSingleOrderValidation(), getOrderByIdController)
  .delete(isAuthenticated, cancelOrderValidation(), cancelOrderController);

router
  .route("/user-storefront/verify")
  .post(verifyDiscountValidation(), verifyDiscountController);

router
  .route("/user-storefront/:id")
  .get(getSingleOrderValidation(), getOrderByIdController);

router
  .route("/stats/:userId")
  .get(isAuthenticated, getOrderStatsValidation(), getOrderStatsController);

export default router;
