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
  status: "pending" | "paid" | "failed";
  channel: "website";
  customerEmail: string;
}
