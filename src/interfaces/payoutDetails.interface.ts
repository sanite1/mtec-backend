import { Types } from "mongoose";

export interface IPayoutDetails {
  userId: Types.ObjectId; // store owner reference
  accountName: string;
  accountNumber: string;
  bankName: string;
  allowCustomerCharges: boolean;
  acceptTerms: boolean;
}

export interface UpdatePayoutDetailsRequest {
  accountName: string;
  accountNumber: string;
  bankName: string;
  allowCustomerCharges: boolean;
  acceptTerms: boolean;
}
