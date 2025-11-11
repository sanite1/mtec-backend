import { Types } from "mongoose";

export interface ITax {
  userId: Types.ObjectId; // store owner
  name: string;
  description?: string;
  rate: number; // percentage rate e.g., 5 for 5%
  location?: string;
  applyToCheckout: boolean;
}

export interface CreateTaxRequest extends ITax {}

export interface GetTaxesParams {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateTaxRequest {
  name?: string;
  description?: string;
  rate?: number; // percentage rate e.g., 5 for 5%
  location?: string;
  applyToCheckout?: boolean;
}
