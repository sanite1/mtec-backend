import { Types } from "mongoose";

export interface StoreAddress {
  country: string;
  state: string;
  zipCode: string;
  streetAddress: string;
}

export interface StoreContact {
  businessEmail: string;
  businessPhone: string;
  website?: string;
}

export interface StoreInformation {
  storeName: string;
  businessName: string;
  businessSector: string;
  tagline?: string;
  storeDescription: string;
}

export interface IStoreDetails {
  userId: Types.ObjectId; // Owner of the store
  logoUrl?: string; // File upload URL
  storeInfo: StoreInformation; // Store information section
  contactInfo: StoreContact; // Contact section
  address: StoreAddress; // Address section
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStoreCreate {
  userId: Types.ObjectId; // Owner of the store
  logoUrl?: string; // File upload URL
  storeInfo: StoreInformation; // Store information section
  contactInfo: StoreContact; // Contact section
  address: StoreAddress; // Address section
}

export interface IStoreUpdate {
  userId: Types.ObjectId; // Owner of the store
  logoUrl?: string; // File upload URL
  storeInfo: StoreInformation; // Store information section
  contactInfo: StoreContact; // Contact section
  address: StoreAddress; // Address section
}
