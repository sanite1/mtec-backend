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

      lowStock: Joi.number().optional().default(3),
      showOutOfStock: Joi.boolean().optional().default(false),
      showStockCount: Joi.boolean().optional().default(false),
      productNoteEnabled: Joi.boolean().optional().default(false),

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

      storeName: Joi.string().optional(),
      businessName: Joi.string().optional(),
      businessSector: Joi.string().optional(),
      slug: Joi.string().optional(),
      storeLink: Joi.string().optional(),
      storeColor: Joi.string().optional(),
      isLightColor: Joi.boolean().optional(),
      tagline: Joi.string().optional(),
      storeDescription: Joi.string().optional(),

      lowStock: Joi.number().optional(),
      showOutOfStock: Joi.boolean().optional(),
      showStockCount: Joi.boolean().optional(),

      productNoteEnabled: Joi.boolean().optional(),
      productNoteTitle: Joi.string().optional(),
      productNotePlaceholder: Joi.string().optional(),

      businessEmail: Joi.string().email().optional(),
      businessPhone: Joi.string().optional(),
      website: Joi.string().uri().optional(),

      country: Joi.string().optional(),
      state: Joi.string().optional(),
      zipCode: Joi.string().optional(),
      streetAddress: Joi.string().optional(),
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
