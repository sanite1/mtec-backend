// models/Payment.ts
import mongoose from "mongoose";

export interface IPayment extends mongoose.Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reference: string;
  orderNumber: string;
  paidAt: Date;
  method: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  channel: "website";
  customerEmail: string;
}
export interface IWallet extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  availableBalance: number;
  pendingBalance: number;
  offlineTransaction: number;
  refund: number;
}
