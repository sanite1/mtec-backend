import { Types } from "mongoose";

export interface IStoreDetails {
  userId: Types.ObjectId; // Owner of the store
  logoUrl?: string; // string upload URL
  country: string;
  state: string;
  zipCode: string;
  streetAddress: string;
  businessEmail: string;
  businessPhone: string;
  slug: string;
  storeLink: string;
  website?: string;
  storeName: string;
  businessName: string;
  businessSector: string;
  tagline?: string;
  storeDescription: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStoreCreate {
  userId: string; // Owner of the store
  logoUrl?: string; // string upload URL
  country: string;
  state: string;
  zipCode: string;
  streetAddress: string;
  slug: string;
  storeLink: string;
  businessEmail: string;
  businessPhone: string;
  website?: string;
  storeName: string;
  businessName: string;
  businessSector: string;
  tagline?: string;
  storeDescription: string;
}

export interface IStoreUpdate {
  userId: string; // Owner of the store
  logoUrl?: string; // string upload URL
  country: string;
  state: string;
  zipCode: string;
  streetAddress: string;
  slug: string;
  storeLink: string;
  businessEmail: string;
  businessPhone: string;
  website?: string;
  storeName: string;
  businessName: string;
  businessSector: string;
  tagline?: string;
  storeDescription: string;
}
