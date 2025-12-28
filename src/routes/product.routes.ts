import { Router } from "express";
import {
  adjustProductQuantity,
  createProduct,
  deleteProduct,
  getProductHistory,
  getProductStatsController,
  getProductsByUser,
  getSingleProduct,
  resetProductHistory,
  updateProduct,
  updateProductVariation,
} from "../controllers/product.controller";
import {
  adjustQuantityValidation,
  createProductValidation,
  deleteProductValidation,
  getProductHistoryValidation,
  getProductStatsValidation,
  getProductsValidation,
  getSingleProductValidation,
  resetProductHistoryValidation,
  updateProductValidation,
  updateProductVariationValidation,
} from "../validations/product.validation";
import { upload } from "../config/upload"; // multer config
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";

const router = Router();

router
  .route("/create")
  .post(
    isAuthenticated,
    upload.fields([{ name: "images", maxCount: 5 }]),
    createProductValidation(),
    createProduct
  );

router
  .route("/:userId")
  .get(isAuthenticated, getProductsValidation(), getProductsByUser);

router
  .route("/stats/:userId")
  .get(isAuthenticated, getProductStatsValidation(), getProductStatsController);

router
  .route("/user-storefront/:userId")
  .get(getProductsValidation(), getProductsByUser);

router
  .route("/:productId/history")
  .get(isAuthenticated, getProductHistoryValidation(), getProductHistory);

router
  .route("/:userId/:productId")
  .get(isAuthenticated, getSingleProductValidation(), getSingleProduct);

router
  .route("/user-storefront/:userId/:productId")
  .get(getSingleProductValidation(), getSingleProduct);

router
  .route("/:productId")
  .patch(
    isAuthenticated,
    upload.fields([{ name: "images", maxCount: 10 }]),
    updateProductValidation(),
    updateProduct
  );

router
  .route("/:id")
  .delete(isAuthenticated, deleteProductValidation(), deleteProduct);

router
  .route("/:id/quantity")
  .patch(isAuthenticated, adjustQuantityValidation(), adjustProductQuantity);

router
  .route("/:productId/variation/:varId")
  .patch(
    isAuthenticated,
    updateProductVariationValidation(),
    updateProductVariation
  );

router
  .route("/:id/history/reset")
  .delete(
    isAuthenticated,
    resetProductHistoryValidation(),
    resetProductHistory
  );

export default router;
