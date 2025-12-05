import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  getDashboardSummaryValidation,
  getSalesOverviewDataValidation,
  getTopSellingProductsValidation,
} from "../validations/dashboard.validation";
import {
  getDashboardSummary,
  getSalesOverviewData,
  getTopSellingProducts,
} from "../controllers/dashboard.controller";

const router = Router();

// GET /api/discount/:userId
router
  .route("/stats/:userId")
  .get(isAuthenticated, getDashboardSummaryValidation(), getDashboardSummary);

router
  .route("/top-products/:userId")
  .get(
    isAuthenticated,
    getTopSellingProductsValidation(),
    getTopSellingProducts
  );

router
  .route("/sales-overview/:userId")
  .get(isAuthenticated, getSalesOverviewDataValidation(), getSalesOverviewData);

export default router;
