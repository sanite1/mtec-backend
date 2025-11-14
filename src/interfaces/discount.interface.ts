import { Types } from "mongoose";

export interface IDiscount {
  userId: Types.ObjectId;
  description: string;
  discountName: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  location: string;
  products: [string];
}

export interface CreateDiscountRequest extends IDiscount {}

export interface GetDiscountParams {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
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
  products?: [string];
}
