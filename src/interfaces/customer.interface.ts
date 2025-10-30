import { Types } from "mongoose";

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
