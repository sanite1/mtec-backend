import { Types } from "mongoose";

export interface IDiscount {
  userId: Types.ObjectId;
  description: string;
  discountName: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  location: Types.ObjectId;
  locationName: string;
  products?: {
    productId?: string;
    variationId?: string;
    name?: string;
    price?: string;
  }[];
}

export interface CreateDiscountRequest extends IDiscount {}

export interface GetDiscountParams {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  location?: string;
  endDate?: string;
}

export interface UpdateDiscountRequest {
  description?: string;
  discountName?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  locationName?: string;
  products?: [string];
}
