import { Schema, model } from "mongoose";
import { IShipping } from "../interfaces/shipping.interface";

const shippingSchema = new Schema<IShipping>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true, trim: true }, // e.g. "Standard Delivery"
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    estimatedDeliveryDays: { type: Number, required: true, min: 1 },
    locationName: { type: String, trim: true, required: true },
    location: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const Shipping = model<IShipping>("Shipping", shippingSchema);
export default Shipping;
