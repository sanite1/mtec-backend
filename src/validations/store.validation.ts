import { Joi, validate } from "express-validation";

export const createStoreValidation = () =>
  validate({
    body: Joi.object({
      userId: Joi.string().required(),

      logoUrl: Joi.string().uri().optional(),

      storeInfo: Joi.object({
        storeName: Joi.string().required(),
        businessName: Joi.string().required(),
        businessSector: Joi.string().required(),
        tagline: Joi.string().optional(),
        storeDescription: Joi.string().required(),
      }).required(),

      contactInfo: Joi.object({
        businessEmail: Joi.string().email().required(),
        businessPhone: Joi.string().required(),
        website: Joi.string().uri().optional(),
      }).required(),

      address: Joi.object({
        country: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        streetAddress: Joi.string().required(),
      }).required(),
    }),
  });

export const updateStoreValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),

    body: Joi.object({
      userId: Joi.forbidden(),

      logoUrl: Joi.string().uri().optional(),

      storeInfo: Joi.object({
        storeName: Joi.string().optional(),
        businessName: Joi.string().optional(),
        businessSector: Joi.string().optional(),
        tagline: Joi.string().optional(),
        storeDescription: Joi.string().optional(),
      }).optional(),

      contactInfo: Joi.object({
        businessEmail: Joi.string().email().optional(),
        businessPhone: Joi.string().optional(),
        website: Joi.string().uri().optional(),
      }).optional(),

      address: Joi.object({
        country: Joi.string().optional(),
        state: Joi.string().optional(),
        zipCode: Joi.string().optional(),
        streetAddress: Joi.string().optional(),
      }).optional(),
    }),
  });

export const deleteStoreValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
  });

export const getStoreByIdValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
  });
