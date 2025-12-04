import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  getDashboardSummaryValidation,
  getSalesOverviewDataValidation,
} from "../validations/dashboard.validation";
import {
  getDashboardSummary,
  getSalesOverviewData,
} from "../controllers/dashboard.controller";

const router = Router();

// GET /api/discount/:userId
router
  .route("/stats/:userId")
  .get(isAuthenticated, getDashboardSummaryValidation(), getDashboardSummary);

router
  .route("/sales-overview/:userId")
  .get(isAuthenticated, getSalesOverviewDataValidation(), getSalesOverviewData);

export default router;
