import { Router } from "express";
import {
  getOnboardingByUserId,
  initOnboarding,
  resetOnboarding,
  updateOnboardingStep,
} from "../controllers/onboarding.controller";
import { validate } from "express-validation";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  getOnboardingValidation,
  resetOnboardingValidation,
  updateOnboardingStepValidation,
} from "../validations/onboarding.validation";

const router = Router();

router.post(
  "/init",
  isAuthenticated,
  //   validate(initOnboardingValidation, {}, {}),
  initOnboarding
);

// GET /api/onboarding/:userId
router.get(
  "/:userId",
  isAuthenticated,
  getOnboardingValidation(),
  getOnboardingByUserId
);

// PATCH /api/onboarding/step/:key
router.patch(
  "/step/:key",
  isAuthenticated,
  updateOnboardingStepValidation(),
  updateOnboardingStep
);

// DELETE /api/onboarding/reset
router.delete(
  "/reset",
  isAuthenticated,
  resetOnboardingValidation(),
  resetOnboarding
);
export default router;
