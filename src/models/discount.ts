import { Schema, model } from "mongoose";
import { IDiscount } from "../interfaces/discount.interface";

const discountSchema = new Schema<IDiscount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    description: { type: String, required: true, trim: true },
    discountName: { type: String, required: true, trim: true },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: { type: Number, required: true, trim: true },
    startDate: { type: String, required: true, trim: true },
    endDate: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Discount = model<IDiscount>("Discount", discountSchema);
export default Discount;
