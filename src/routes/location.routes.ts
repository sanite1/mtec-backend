import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  createLocation,
  deleteLocation,
  getLocations,
  updateLocation,
} from "../controllers/location.controller";
import {
  createLocationValidation,
  deleteLocationValidation,
  getLocationValidation,
  updateLocationValidation,
} from "../validations/location.validation";

const router = Router();

// GET /api/location/:userId
router
  .route("/:userId")
  .get(isAuthenticated, getLocationValidation(), getLocations);

router
  .route("/user-storefront/:userId")
  .get(getLocationValidation(), getLocations);

router
  .route("/")
  .post(isAuthenticated, createLocationValidation(), createLocation);

router
  .route("/:id")
  .patch(isAuthenticated, updateLocationValidation(), updateLocation)
  .delete(isAuthenticated, deleteLocationValidation(), deleteLocation);

export default router;
