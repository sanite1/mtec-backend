import { Types } from "mongoose";

export interface ILocation {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

export interface CreateLocationRequest extends ILocation {}

export interface GetLocationParams {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateLocationRequest {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}
