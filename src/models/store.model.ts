import mongoose, { Schema, Document } from "mongoose";
import { IStoreDetails } from "../interfaces/store.interface";

export interface StoreDetailsDocument extends IStoreDetails, Document {}

const StoreDetailsSchema = new Schema<StoreDetailsDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    logoUrl: { type: String, required: false },

    country: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    streetAddress: { type: String, required: true },
    slug: { type: String, required: true },
    storeLink: { type: String, required: true },
    storeColor: { type: String, required: true },
    isLightColor: { type: Boolean, required: true },

    lowStock: { type: Number, required: true },
    showOutOfStock: { type: Boolean, required: true },
    showStockCount: { type: Boolean, required: true },

    productNoteEnabled: { type: Boolean, required: true },
    productNoteTitle: { type: String, required: true },
    productNotePlaceholder: { type: String, required: true },

    businessEmail: { type: String, required: true },
    businessPhone: { type: String, required: true },
    website: { type: String, required: false },

    storeName: { type: String, required: true },
    businessName: { type: String, required: true },
    businessSector: { type: String, required: true },
    tagline: { type: String, required: false },
    storeDescription: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const Store =
  mongoose.models.StoreDetails ||
  mongoose.model<StoreDetailsDocument>("StoreDetails", StoreDetailsSchema);
