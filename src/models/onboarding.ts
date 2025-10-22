import { Schema, model } from "mongoose";
import { IOnboarding } from "../interfaces/onboarding.interface";

const onboardingSchema = new Schema<IOnboarding>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    steps: [
      {
        key: { type: String, required: true },
        completed: { type: Boolean, default: false },
        optional: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
      },
    ],
    overallProgress: { type: Number, default: 0 },
    completedSteps: { type: Number, default: 0 },
    totalSteps: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
      },
    },
  }
);

const Onboarding = model<IOnboarding>("Onboarding", onboardingSchema);

export default Onboarding;
