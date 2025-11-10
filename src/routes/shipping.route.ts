import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  createShipping,
  deleteShipping,
  getShipping,
  updateShipping,
} from "../controllers/shipping.controller";
import {
  createShippingValidation,
  deleteShippingValidation,
  getShippingValidation,
  updateShippingValidation,
} from "../validations/shipping.validation";

const router = Router();

router
  .route("/")
  .post(isAuthenticated, createShippingValidation(), createShipping);

router
  .route("/:userId")
  .get(isAuthenticated, getShippingValidation(), getShipping);

router
  .route("/:id")
  .patch(isAuthenticated, updateShippingValidation(), updateShipping)
  .delete(isAuthenticated, deleteShippingValidation(), deleteShipping);

export default router;
