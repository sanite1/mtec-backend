import { Types } from "mongoose";
import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import {
  IInitOnboardingRequest,
  IOnboardingStep,
} from "../interfaces/onboarding.interface";
import Onboarding from "../models/onboarding";
import { Store } from "../models/store.model";
import { Product } from "../models/product";
import Shipping from "../models/shipping";
import PayoutDetails from "../models/payoutDetails";

// TODO: Replace this with your permanent step list once you provide it
const DEFAULT_STEPS: IOnboardingStep[] = [
  { key: "storeDetails", completed: false, optional: false },
  { key: "products", completed: false, optional: false },
  { key: "shipping", completed: false, optional: false },
  { key: "payout", completed: false, optional: false },
  { key: "preview", completed: false, optional: true },
  { key: "trial", completed: false, optional: true },
];

export const defaultOnboardingSteps = [
  { key: "storeDetails", optional: false },
  { key: "products", optional: false },
  { key: "shipping", optional: false },
  { key: "payout", optional: false },
  { key: "preview", optional: true },
  { key: "trial", optional: true },
];

export const initOnboardingService = async (data: IInitOnboardingRequest) => {
  const existing = await Onboarding.findOne({ userId: data.userId });
  if (existing) {
    throw new ApiError(400, "Onboarding already initialized for this user");
  }

  const totalSteps = DEFAULT_STEPS.filter((s) => !s.optional).length;

  const onboarding = await Onboarding.create({
    userId: data.userId,
    steps: DEFAULT_STEPS,
    totalSteps,
    completedSteps: 0,
    overallProgress: 0,
    isCompleted: false,
  });

  return new ApiResponse(
    201,
    "Onboarding initialized successfully",
    onboarding
  );
};
export const getOnboardingService = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // ✅ Fetch real setup data (SOURCE OF TRUTH)
  const [storeDetails, products, shipping, payout] = await Promise.all([
    Store.findOne({ userId }),
    Product.findOne({ userId }),
    Shipping.findOne({ userId }),
    PayoutDetails.findOne({ userId }),
  ]);

  // ✅ Determine completion from database
  const completionMap: Record<string, boolean> = {
    storeDetails: !!storeDetails,
    products: !!products,
    shipping: !!shipping,
    payout: !!payout,
    preview: false, // optional/manual
    trial: false, // optional/manual
  };

  // ✅ Build fresh steps array dynamically
  const steps = defaultOnboardingSteps.map((step) => {
    const completed = completionMap[step.key] ?? false;

    return {
      key: step.key,
      optional: step.optional,
      completed,
      completedAt: completed ? new Date() : null,
    };
  });

  // ✅ Calculate required stats
  const requiredSteps = steps.filter((s) => !s.optional);
  const completedRequiredSteps = requiredSteps.filter((s) => s.completed);

  const totalSteps = requiredSteps.length;
  const completedSteps = completedRequiredSteps.length;

  const overallProgress = Math.round((completedSteps / totalSteps) * 100);

  const isCompleted = completedSteps === totalSteps;

  // ✅ Find or update onboarding record
  let onboarding = await Onboarding.findOne({ userId });

  if (!onboarding) {
    onboarding = await Onboarding.create({
      userId,
      steps,
      overallProgress,
      completedSteps,
      totalSteps,
      isCompleted,
    });
  } else {
    onboarding.steps = steps;
    onboarding.overallProgress = overallProgress;
    onboarding.completedSteps = completedSteps;
    onboarding.totalSteps = totalSteps;
    onboarding.isCompleted = isCompleted;
    await onboarding.save();
  }

  return new ApiResponse(200, "Onboarding progress retrieved", onboarding);
};

export const updateOnboardingStepService = async (
  userId: string,
  key: string,
  completed: boolean
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const onboarding = await Onboarding.findOne({ userId });
  if (!onboarding) {
    // return await initOnboardingService({ userId });
    throw new ApiError(404, "Onboarding record not found");
  }

  // Find the step
  const step = onboarding.steps.find((s) => s.key === key);
  if (!step) {
    throw new ApiError(404, `Step '${key}' not found`);
  }

  // Update step status
  step.completed = completed;
  step.completedAt = completed ? new Date() : undefined;

  // Update progress
  const totalSteps = onboarding.steps.filter((s) => !s.optional).length;
  const completedSteps = onboarding.steps.filter(
    (s) => s.completed && !s.optional
  ).length;

  onboarding.completedSteps = completedSteps;
  onboarding.totalSteps = totalSteps;
  onboarding.overallProgress = Math.round((completedSteps / totalSteps) * 100);
  onboarding.isCompleted = completedSteps === totalSteps;

  await onboarding.save();

  return new ApiResponse(
    200,
    `Step '${key}' marked as ${completed ? "completed" : "incomplete"}`,
    onboarding
  );
};

export const resetOnboardingService = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const onboarding = await Onboarding.findOne({ userId });
  if (!onboarding) {
    throw new ApiError(404, "Onboarding record not found");
  }

  // Reset all steps to default state
  onboarding.steps = defaultOnboardingSteps.map((s) => ({
    key: s.key,
    completed: false,
    optional: !!s.optional,
  }));

  onboarding.completedSteps = 0;
  onboarding.totalSteps = defaultOnboardingSteps.filter(
    (s) => !s.optional
  ).length;
  onboarding.overallProgress = 0;
  onboarding.isCompleted = false;

  await onboarding.save();

  return new ApiResponse(
    200,
    "Onboarding progress reset successfully",
    onboarding
  );
};
