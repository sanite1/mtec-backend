import { Schema, model } from "mongoose";
import { Storefront } from "../interfaces/storefront.interface";

const bannerSchema = new Schema(
  {
    title: { type: String },
    subtext: { type: String },
    image: { type: String },
  },
  { _id: false }
);

const aboutSchema = new Schema(
  {
    title: { type: String },
    content: { type: String },
  },
  { _id: false }
);

const contactSchema = new Schema(
  {
    email: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  { _id: false }
);

const locationSchema = new Schema(
  {
    address: { type: String },
  },
  { _id: false }
);

const newsletterSchema = new Schema(
  {
    headline: { type: String },
    subtext: { type: String },
    img: { type: String },
  },
  { _id: false }
);

const returnPolicySchema = new Schema(
  {
    content: { type: String },
  },
  { _id: false }
);

const socialMediaSchema = new Schema(
  {
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String },
    tiktok: { type: String },
    youtube: { type: String },
  },
  { _id: false }
);

const customMessageSchema = new Schema(
  {
    message: { type: String },
  },
  { _id: false }
);

const productVariationSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const whatsappSchema = new Schema(
  {
    number: { type: String },
  },
  { _id: false }
);

const storefrontSchema = new Schema<Storefront>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    theme: { type: String, default: "default" },

    banner: bannerSchema,
    about: aboutSchema,
    contact: contactSchema,
    location: locationSchema,
    newsletter: newsletterSchema,
    returnPolicy: returnPolicySchema,
    socialMedia: socialMediaSchema,
    customMessage: customMessageSchema,
    productVariation: productVariationSchema,
    whatsapp: whatsappSchema,
  },
  { timestamps: true }
);

const Storefront = model<Storefront>("Storefront", storefrontSchema);
export default Storefront;
