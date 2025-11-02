import mongoose, { Schema, model } from "mongoose";
import { Storefront } from "../interfaces/storefront.interface";

const storefrontSchema = new Schema<Storefront>(
  {
    userId: { type: String, required: true, unique: true },

    theme: { type: String, default: "default" },

    banner: {
      title: String,
      image: String,
    },
    about: {
      title: String,
      content: String,
    },
    contact: {
      email: String,
      phone: String,
      address: String,
    },
    location: {
      address: String,
    },
    newsletter: {
      headline: String,
      subtext: String,
      img: String,
    },
    returnPolicy: {
      content: String,
    },
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      tiktok: String,
      youtube: String,
    },
    customMessage: {
      message: String,
    },
    productVariation: {
      enabled: { type: Boolean, default: false },
    },
    whatsapp: {
      number: String,
    },
  },
  { timestamps: true }
);

const Storefront = model<Storefront>("Storefront", storefrontSchema);
export default Storefront;
