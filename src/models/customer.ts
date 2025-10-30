import { Schema, model } from "mongoose";
import { ICustomer } from "../interfaces/customer.interface";

const addressSchema = new Schema(
  {
    address: { type: String, trim: true },
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    zip: { type: String, trim: true },
  },
  { _id: false }
);

const customerSchema = new Schema<ICustomer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },

    additionalInfo: { type: String, trim: true },
    newsletterSubscribed: { type: Boolean, default: false },

    shipping: { type: addressSchema, required: true },
    billing: {
      type: new Schema(
        {
          sameAsShipping: { type: Boolean, default: false },
          ...addressSchema.obj,
        },
        { _id: false }
      ),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Customer = model<ICustomer>("Customer", customerSchema);
export default Customer;
