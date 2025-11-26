import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  createStoreValidation,
  deleteStoreValidation,
  getStoreByIdValidation,
  resolveSlugValidation,
  updateStoreValidation,
} from "../validations/store.validation";
import {
  createStore,
  deleteStore,
  getStoreById,
  resolveSlug,
  updateStore,
} from "../controllers/store.controller";
import { upload } from "../config/upload";

const router = Router();

router
  .route("/:id")
  .get(isAuthenticated, getStoreByIdValidation(), getStoreById)
  .patch(
    isAuthenticated,
    upload.fields([{ name: "logoUrl", maxCount: 1 }]),
    updateStoreValidation(),
    updateStore
  )
  .delete(isAuthenticated, deleteStoreValidation(), deleteStore);

router
  .route("/")
  .post(
    isAuthenticated,
    upload.fields([{ name: "logoUrl", maxCount: 1 }]),
    createStoreValidation(),
    createStore
  );

router
  .route("/resolve/:slug")
  .get(isAuthenticated, resolveSlugValidation(), resolveSlug);

export default router;
