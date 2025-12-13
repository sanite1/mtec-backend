// models/Payment.ts
import mongoose, { model } from "mongoose";
import { IPayment } from "../interfaces/payment.interface";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reference: { type: String, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    channel: { type: String, default: "website" },
    customerEmail: { type: String, required: true },
  },
  { timestamps: true }
);

// export default mongoose.model<IPayment>("Payment", paymentSchema);

const Payment = model<IPayment>("Payment", paymentSchema);
export default Payment;
