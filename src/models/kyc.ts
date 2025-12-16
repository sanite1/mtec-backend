// models/KycProfile.ts
import { Schema, model, Types } from "mongoose";

const KycProfileSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },

    type: {
      type: String,
      enum: ["individual", "business"],
      required: true,
    },

    status: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },

    provider: {
      type: String,
      enum: ["paystack", "dojah", "prembly"],
      required: true,
    },

    rejectionReason: String,
    verifiedAt: Date,
  },
  { timestamps: true }
);

const KycIdentitySchema = new Schema(
  {
    kycProfileId: {
      type: Types.ObjectId,
      ref: "KycProfile",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["bvn", "nin"],
      required: true,
    },

    last4: { type: String, required: true },

    /**
     * Hash of full BVN/NIN (never store raw value)
     */
    hash: { type: String, required: true },

    providerReference: { type: String, required: true },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },

    verifiedAt: Date,
  },
  { timestamps: true }
);

// ✅ Ensure only one BVN and one NIN per KYC profile
KycIdentitySchema.index({ kycProfileId: 1, type: 1 }, { unique: true });

const KycBusinessSchema = new Schema(
  {
    kycProfileId: {
      type: Types.ObjectId,
      ref: "KycProfile",
      required: true,
      index: true,
    },

    cacNumber: { type: String, required: true, unique: true },
    businessName: { type: String, required: true },

    businessType: {
      type: String,
      enum: ["sole", "limited"],
      required: true,
    },

    providerReference: String,

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    verifiedAt: Date,
  },
  { timestamps: true }
);

export const KycProfile = model("KycProfile", KycProfileSchema);
export const KycIdentity = model("KycIdentity", KycIdentitySchema);
export const KycBusiness = model("KycBusiness", KycBusinessSchema);
