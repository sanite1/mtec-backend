import { Router } from "express";
import { getStorefrontValidation } from "../validations/storefront.validation";
import { getStorefrontController } from "../controllers/storefront.controller";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";

const router = Router();

router
  .route("/:userId")
  .get(isAuthenticated, getStorefrontValidation(), getStorefrontController);

export default router;
