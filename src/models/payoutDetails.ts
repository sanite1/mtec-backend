import { Schema, model } from "mongoose";
import { IPayoutDetails } from "../interfaces/payoutDetails.interface";

const shippingSchema = new Schema<IPayoutDetails>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    accountName: { type: String, required: true, trim: true },
    accountNumber: { type: String, trim: true },
    bankName: { type: String, required: true, min: 0 },
    acceptTerms: { type: Boolean, trim: true },
    allowCustomerCharges: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const PayoutDetails = model<IPayoutDetails>("PayoutDetails", shippingSchema);
export default PayoutDetails;
