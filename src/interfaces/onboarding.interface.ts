import { Types } from "mongoose";

export interface IOnboardingStep {
  key: string;
  completed: boolean;
  optional: boolean;
  completedAt?: Date | null;
}

export interface IOnboarding {
  userId: Types.ObjectId;
  steps: IOnboardingStep[];
  overallProgress: number;
  completedSteps: number;
  totalSteps: number;
  isCompleted: boolean;
}

export interface IInitOnboardingRequest {
  userId: string;
}

export interface UserIdParam {
  userId: string;
}
