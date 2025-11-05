import { Router } from "express";
import {
  getStorefrontValidation,
  updateStorefrontValidation,
} from "../validations/storefront.validation";
import {
  getStorefrontController,
  updateStorefront,
} from "../controllers/storefront.controller";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import { upload } from "../config/upload";

const router = Router();

router
  .route("/:userId")
  .get(isAuthenticated, getStorefrontValidation(), getStorefrontController);

router.put(
  "/:userId",
  isAuthenticated,
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "newsletterImg", maxCount: 1 },
  ]),
  updateStorefrontValidation(),
  updateStorefront
);

export default router;
