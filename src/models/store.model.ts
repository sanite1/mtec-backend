import mongoose, { Schema, Document } from "mongoose";
import { IStoreDetails } from "../interfaces/store.interface";

export interface StoreDetailsDocument extends IStoreDetails, Document {}

const StoreAddressSchema = new Schema(
  {
    country: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    streetAddress: { type: String, required: true },
  },
  { _id: false }
);

const StoreContactSchema = new Schema(
  {
    businessEmail: { type: String, required: true },
    businessPhone: { type: String, required: true },
    website: { type: String, required: false },
  },
  { _id: false }
);

const StoreInformationSchema = new Schema(
  {
    storeName: { type: String, required: true },
    businessName: { type: String, required: true },
    businessSector: { type: String, required: true },
    tagline: { type: String, required: false },
    storeDescription: { type: String, required: true },
  },
  { _id: false }
);

const StoreDetailsSchema = new Schema<StoreDetailsDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    logoUrl: { type: String, required: false },

    storeInfo: { type: StoreInformationSchema, required: true },

    contactInfo: { type: StoreContactSchema, required: true },

    address: { type: StoreAddressSchema, required: true },
  },
  {
    timestamps: true,
  }
);

export const Store =
  mongoose.models.StoreDetails ||
  mongoose.model<StoreDetailsDocument>("StoreDetails", StoreDetailsSchema);
