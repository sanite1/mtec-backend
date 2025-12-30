import { Types } from "mongoose";
import { ShippingAddress } from "./order.interface";

export interface ICustomer {
  userId: Types.ObjectId; // store owner
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  additionalInfo?: string;
  newsletterSubscribed?: boolean;

  shipping?: {
    address?: string;
    country: string;
    state?: string;
    city?: string;
    zip?: string;
  };

  billing?: {
    sameAsShipping?: boolean;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    zip?: string;
  };
}

export interface CreateCustomerRequest extends ICustomer {}

export interface GetCustomersParams {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  subscribed?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateNewsletterParams {
  customerId: string;
  userId: string;
  newsletterSubscribed: boolean;
}

export interface GetCustomerOrdersParams {
  customerId: string;
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateOrGetCustomerInput {
  userId: string;
  shipping: ShippingAddress;
}
