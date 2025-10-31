import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomerOrders,
  getCustomerStats,
  getCustomers,
  updateCustomer,
  updateNewsletter,
} from "../controllers/customer.controller";
import {
  createCustomerValidation,
  deleteCustomerValidation,
  getCustomerByIdValidation,
  getCustomerOrdersValidation,
  getCustomerStatsValidation,
  getCustomersValidation,
  updateCustomerValidation,
  updateNewsletterValidation,
} from "../validations/customer.validation";

const router = Router();

router
  .route("/")
  .post(isAuthenticated, createCustomerValidation(), createCustomer);

router
  .route("/all/:userId")
  .get(isAuthenticated, getCustomersValidation(), getCustomers);

router
  .route("/:id")
  .get(isAuthenticated, getCustomerByIdValidation(), getCustomerById)
  .patch(isAuthenticated, updateCustomerValidation(), updateCustomer);

router
  .route("/:id/:userId")
  .delete(isAuthenticated, deleteCustomerValidation(), deleteCustomer);

router
  .route("/:id/newsletter")
  .patch(isAuthenticated, updateNewsletterValidation(), updateNewsletter);

router
  .route("/:id/orders/:userId")
  .get(isAuthenticated, getCustomerOrdersValidation(), getCustomerOrders);

router
  .route("/stats/:userId")
  .get(isAuthenticated, getCustomerStatsValidation(), getCustomerStats);
export default router;
