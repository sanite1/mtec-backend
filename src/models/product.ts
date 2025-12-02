import { Schema, model, Types } from "mongoose";
import {
  IProduct,
  IProductHistory,
  IProductVariation,
  OptionValue,
  VariantsOptionGroup,
} from "../interfaces/product.interface";

const optionValueSchema = new Schema<OptionValue>(
  {
    id: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const variantsOptionGroupSchema = new Schema<VariantsOptionGroup>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    values: { type: [optionValueSchema], required: true },
  },
  { _id: false }
);

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
    location: { type: String, trim: true },
    locationName: { type: String, trim: true },
    price: { type: Number, required: false },
    priceRange: { type: String, required: false },
    costPrice: { type: Number, required: false },
    discountPrice: { type: Number, required: false },
    unit: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    images: [{ type: String }],
    variantsOptionGroup: [variantsOptionGroupSchema],
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
