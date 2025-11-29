import { Joi, validate } from "express-validation";

export const getShippingValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),

    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).optional(),
      search: Joi.string().allow("").optional(),
      location: Joi.string().optional(),
      isActive: Joi.string().valid("true", "false").optional(),
    }),
  });

export const createShippingValidation = () =>
  validate({
    body: Joi.object({
      userId: Joi.string().required(),

      name: Joi.string().required(),
      description: Joi.string().allow("").optional(),
      price: Joi.number().min(0).required(),
      estimatedDeliveryDays: Joi.number().min(1).required(),

      location: Joi.string().required(),
      locationName: Joi.string().required(),
      isActive: Joi.boolean().default(true),
    }),
  });

export const updateShippingValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),

    body: Joi.object({
      userId: Joi.string().forbidden(),

      name: Joi.string().optional(),
      description: Joi.string().allow("").optional(),
      price: Joi.number().min(0).optional(),
      estimatedDeliveryDays: Joi.number().min(1).optional(),
      location: Joi.string().optional(),
      isActive: Joi.boolean().optional(),
    }),
  });

export const deleteShippingValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
  });
