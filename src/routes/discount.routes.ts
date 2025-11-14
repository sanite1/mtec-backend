import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  createDiscount,
  deleteDiscount,
  getDiscountStatsController,
  getDiscounts,
  updateDiscount,
} from "../controllers/discount.controller";
import {
  createDiscountValidation,
  deleteDiscountValidation,
  getDiscountStatsValidation,
  getDiscountValidation,
  updateDiscountValidation,
} from "../validations/discount.validation";

const router = Router();

// GET /api/discount/:userId
router
  .route("/:userId")
  .get(isAuthenticated, getDiscountValidation(), getDiscounts);

router
  .route("/")
  .post(isAuthenticated, createDiscountValidation(), createDiscount);

router
  .route("/:id")
  .patch(isAuthenticated, updateDiscountValidation(), updateDiscount)
  .delete(isAuthenticated, deleteDiscountValidation(), deleteDiscount);

router
  .route("/stats/:userId")
  .get(
    isAuthenticated,
    getDiscountStatsValidation(),
    getDiscountStatsController
  );

export default router;
