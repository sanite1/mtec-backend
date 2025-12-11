import { Joi, validate } from "express-validation";

export const createStoreValidation = () =>
  validate({
    body: Joi.object({
      userId: Joi.string().required(),

      logoUrl: Joi.string().uri().optional(),

      storeName: Joi.string().required(),
      businessName: Joi.string().required(),
      businessSector: Joi.string().required(),
      slug: Joi.string().required(),
      storeLink: Joi.string().required(),
      tagline: Joi.string().optional(),
      storeDescription: Joi.string().required(),
      storeColor: Joi.string().required(),
      isLightColor: Joi.boolean().required(),

      businessEmail: Joi.string().email().required(),
      businessPhone: Joi.string().required(),
      website: Joi.string().uri().optional(),

      country: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      streetAddress: Joi.string().required(),
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

      storeName: Joi.string().required(),
      businessName: Joi.string().required(),
      businessSector: Joi.string().required(),
      slug: Joi.string().required(),
      storeLink: Joi.string().required(),
      storeColor: Joi.string().required(),
      isLightColor: Joi.boolean().required(),
      tagline: Joi.string().optional(),
      storeDescription: Joi.string().required(),

      businessEmail: Joi.string().email().required(),
      businessPhone: Joi.string().required(),
      website: Joi.string().uri().optional(),

      country: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      streetAddress: Joi.string().required(),
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

export const resolveSlugValidation = () =>
  validate({
    params: Joi.object({
      slug: Joi.string().required(),
    }),
  });
