import { validate } from "express-validation";
import Joi from "joi";

export const getStorefrontValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
  });

export const updateStorefrontValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
    body: Joi.object({
      theme: Joi.string().optional(),
      bannerImage: Joi.string().uri().optional(),
      banner: Joi.object({
        title: Joi.string().optional(),
        subtext: Joi.string().optional(),
        // image handled by file upload
      }).optional(),

      about: Joi.object({
        title: Joi.string().optional(),
        content: Joi.string().optional(),
      }).optional(),

      contact: Joi.object({
        email: Joi.string().email().optional(),
        phone: Joi.string().optional(),
        address: Joi.string().optional(),
      }).optional(),

      location: Joi.object({
        address: Joi.string().optional(),
      }).optional(),

      newsletterImg: Joi.string().uri().optional(),
      newsletter: Joi.object({
        headline: Joi.string().optional(),
        subtext: Joi.string().optional(),
        // img handled by file upload
      }).optional(),

      returnPolicy: Joi.object({
        content: Joi.string().optional(),
      }).optional(),

      socialMedia: Joi.object({
        facebook: Joi.string().optional(),
        instagram: Joi.string().optional(),
        twitter: Joi.string().optional(),
        tiktok: Joi.string().optional(),
        youtube: Joi.string().optional(),
      }).optional(),

      customMessage: Joi.object({
        message: Joi.string().optional(),
      }).optional(),

      productVariation: Joi.object({
        enabled: Joi.boolean().optional(),
      }).optional(),

      whatsapp: Joi.object({
        number: Joi.string().optional(),
      }).optional(),
    }),
  });
