import { Types } from "mongoose";

export interface IProduct {
  userId: Types.ObjectId;
  name: string;
  location: string;
  sku: string;
  description?: string;
  priceRange?: string;
  // These fields are required only when no variations exist
  price?: number;
  costPrice?: number;
  discountPrice?: number;
  totalStock: number;
  variantsOptionGroup?: VariantsOptionGroup[];
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

export interface OptionValue {
  id: string;
  value: string;
}

export interface VariantsOptionGroup {
  id: string;
  name: string; // e.g. "Color", "Size"
  values: OptionValue[]; // e.g. [{ id: "1", value: "Red" }, { id: "2", value: "Blue" }]
}

// DTO for create product request
export interface CreateProductRequest {
  userId: string;
  name: string;
  location: string;
  sku: string;
  description?: string;
  price?: number;
  costPrice?: number;
  discountPrice?: number;
  unit: string;
  collection?: string;
  images?: string[];
  totalStock?: number;
  variantsOptionGroup?: VariantsOptionGroup[];
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
