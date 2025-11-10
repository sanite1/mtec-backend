import { Types } from "mongoose";

export interface IShipping {
  userId: Types.ObjectId; // store owner reference

  name: string;
  description?: string;
  price: number;
  estimatedDeliveryDays: number;
  location?: string;
  isActive?: boolean;
}

export interface GetShippingParams {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  isActive?: string;
}
