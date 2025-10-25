import { Types } from "mongoose";

export interface IProduct {
  userId: Types.ObjectId;
  name: string;
  sku: string;
  description?: string;
  // These fields are required only when no variations exist
  price?: number;
  costPrice?: number;
  discountPrice?: number;
  totalStock: number;
  unit: string;
  collection?: string;
  images?: string[];
  isActive?: boolean;
}

export interface IProductVariation {
  productId: Types.ObjectId;
  name: string;
  sku: string;
  price: number;
  costPrice?: number;
  discountPrice?: number;
  stock: number;
}

export interface IProductHistory {
  productId: Types.ObjectId;
  source: string;
  activity: "added" | "removed" | "returned" | "sold";
  qtyBefore: number;
  qtyChange: number;
  qtyAfter: number;
}

// DTO for create product request
export interface CreateProductRequest {
  userId: string;
  name: string;
  sku: string;
  description?: string;
  price?: number;
  costPrice?: number;
  discountPrice?: number;
  unit: string;
  collection?: string;
  images?: string[];
  totalStock?: number;
  variations?: {
    name: string;
    sku: string;
    price: number;
    costPrice?: number;
    discountPrice?: number;
    stock: number;
  }[];
}

export interface ProductFilterParams {
  userId: string;
  collection?: string;
  name?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface AdjustQuantityPayload {
  type: "added" | "removed" | "returned";
  variationId?: string;
  quantity: number;
  source?: string; // e.g. "manual" | "system" | "admin-panel"
}
