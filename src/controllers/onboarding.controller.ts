import { ExpresFunction } from "../interfaces/helper.interface";
import {
  IInitOnboardingRequest,
  UserIdParam,
} from "../interfaces/onboarding.interface";
import {
  getOnboardingService,
  initOnboardingService,
  resetOnboardingService,
  updateOnboardingStepService,
} from "../services/onboarding.service";

export const initOnboarding = async (userId: { userId: string }) => {
  try {
    const result = await initOnboardingService(userId);
    return result;
  } catch (error) {
    console.warn(error);
  }
};

export const getOnboardingByUserId: ExpresFunction<{ userId: string }> = async (
  req,
  res,
  next
) => {
  try {
    const { userId } = req.params as UserIdParam;
    const result = await getOnboardingService(userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateOnboardingStep: ExpresFunction = async (req, res, next) => {
  try {
    const { key } = req.params as { key: string };
    const { userId, completed } = req.body as {
      userId: string;
      completed: boolean;
    };

    const result = await updateOnboardingStepService(userId, key, completed);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetOnboarding: ExpresFunction = async (req, res, next) => {
  try {
    const { userId } = req.body as UserIdParam;
    const result = await resetOnboardingService(userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
