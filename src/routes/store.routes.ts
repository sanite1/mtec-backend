import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  createStoreValidation,
  deleteStoreValidation,
  getStoreByIdValidation,
  updateStoreValidation,
} from "../validations/store.validation";
import {
  createStore,
  deleteStore,
  getStoreById,
  updateStore,
} from "../controllers/store.controller";

const router = Router();

// ===============================
// GET STORE DETAILS BY ID
// GET /api/store-details/:id
// ===============================
router
  .route("/:id")
  .get(isAuthenticated, getStoreByIdValidation(), getStoreById)
  .patch(isAuthenticated, updateStoreValidation(), updateStore)
  .delete(isAuthenticated, deleteStoreValidation(), deleteStore);

// ===============================
// CREATE STORE DETAILS
// POST /api/store-details
// ===============================
router.route("/").post(isAuthenticated, createStoreValidation(), createStore);

export default router;
