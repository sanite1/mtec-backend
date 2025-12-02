import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  createTax,
  deleteTax,
  getSingleStorefrontTax,
  getTaxes,
  updateTax,
} from "../controllers/taxes.controller";
import {
  createTaxValidation,
  deleteTaxValidation,
  getTaxesValidation,
  updateTaxValidation,
} from "../validations/taxes.validation";

const router = Router();

// GET /api/taxes/:userId
router.route("/:userId").get(isAuthenticated, getTaxesValidation(), getTaxes);
router
  .route("/user-storefront/:userId")
  .get(getTaxesValidation(), getSingleStorefrontTax);

router.route("/").post(isAuthenticated, createTaxValidation(), createTax);

router
  .route("/:id")
  .patch(isAuthenticated, updateTaxValidation(), updateTax)
  .delete(isAuthenticated, deleteTaxValidation(), deleteTax);

export default router;
