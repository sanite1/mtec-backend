import { Schema, model, Types } from "mongoose";
import {
  IProduct,
  IProductHistory,
  IProductVariation,
} from "../interfaces/product.interface";

// ========== Product Schema ==========
const productSchema = new Schema<IProduct>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: false }, // optional if variations exist
    costPrice: { type: Number, required: false },
    discountPrice: { type: Number, required: false },
    unit: { type: String, required: true, trim: true },
    collection: { type: String, trim: true },
    images: [{ type: String }],
    totalStock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ========== Product Variation Schema ==========
const productVariationSchema = new Schema<IProductVariation>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    costPrice: { type: Number, required: false },
    discountPrice: { type: Number, required: false },
    stock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ========== Product History Schema ==========
const productHistorySchema = new Schema<IProductHistory>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    source: { type: String, required: true },
    activity: {
      type: String,
      enum: ["added", "removed", "returned", "sold"],
      required: true,
    },
    qtyBefore: { type: Number, required: true },
    qtyChange: { type: Number, required: true },
    qtyAfter: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Product = model<IProduct>("Product", productSchema);
export const ProductVariation = model<IProductVariation>(
  "ProductVariation",
  productVariationSchema
);
export const ProductHistory = model<IProductHistory>(
  "ProductHistory",
  productHistorySchema
);
