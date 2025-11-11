import { Schema, model } from "mongoose";
import { ITax } from "../interfaces/taxes.interface";

const taxSchema = new Schema<ITax>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    location: {
      type: String,
      trim: true,
    },
    applyToCheckout: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Tax = model<ITax>("Tax", taxSchema);
export default Tax;
