import { Schema, model } from "mongoose";
import { IUser } from "../interfaces/user.interface";

const userSchema = new Schema<IUser>(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    middlename: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: { type: String, trim: true },
    profilePicture: { type: String },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "instructor", "student"],
      default: "student",
    },
    verified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    verificationToken: { type: String },
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
    dob: { type: Date },
    kycStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },

    kycType: {
      type: String,
      enum: ["individual", "business"],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        delete ret.verificationToken;
      },
    },
  }
);

const User = model("User", userSchema);

export default User;
