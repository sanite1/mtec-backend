import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";

import {
  createPayoutDetails,
  deletePayoutDetails,
  getPayoutDetails,
  updatePayoutDetails,
} from "../controllers/payoutDetails.comtroller";

import {
  createPayoutDetailsValidation,
  deletePayoutDetailsValidation,
  getPayoutDetailsValidation,
  updatePayoutDetailsValidation,
} from "../validations/payoutDetails.validation";

const router = Router();

// GET /api/payout-details/:userId
router
  .route("/:userId")
  .get(isAuthenticated, getPayoutDetailsValidation(), getPayoutDetails);

// POST /api/payout-details
router
  .route("/")
  .post(isAuthenticated, createPayoutDetailsValidation(), createPayoutDetails);

// PATCH & DELETE /api/payout-details/:id
router
  .route("/:id")
  .patch(isAuthenticated, updatePayoutDetailsValidation(), updatePayoutDetails)
  .delete(
    isAuthenticated,
    deletePayoutDetailsValidation(),
    deletePayoutDetails
  );

export default router;
