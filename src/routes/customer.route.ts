import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
  updateNewsletter,
} from "../controllers/customer.controller";
import {
  createCustomerValidation,
  deleteCustomerValidation,
  getCustomerByIdValidation,
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
  .patch(isAuthenticated, updateCustomerValidation(), updateCustomer)
  .delete(isAuthenticated, deleteCustomerValidation(), deleteCustomer);

router
  .route("/:id/newsletter")
  .patch(isAuthenticated, updateNewsletterValidation(), updateNewsletter);

export default router;
