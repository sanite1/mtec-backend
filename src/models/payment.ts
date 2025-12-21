// models/Payment.ts
import mongoose, { model } from "mongoose";
import { IPayment, IWallet } from "../interfaces/payment.interface";

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
    orderNumber: { type: String, trim: true },
    paidAt: { type: Date, trim: true },
    amount: { type: Number, required: true },
    method: { type: String, default: "N/A" },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    channel: { type: String, default: "website" },
    customerEmail: { type: String, required: true },
  },
  { timestamps: true }
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    offlineTransaction: { type: Number, default: 0 },
    withdrawnBalance: { type: Number, default: 0 },
    pendingWithdrawalBalance: { type: Number, default: 0 },
    refund: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// export default mongoose.model<IPayment>("Payment", paymentSchema);

export const Payment = model<IPayment>("Payment", paymentSchema);
export const Wallet = model<IWallet>("Wallet", walletSchema);
