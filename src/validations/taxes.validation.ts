import { Joi, validate } from "express-validation";

export const getTaxesValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).optional(),
      search: Joi.string().allow("").optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
    }),
  });

export const createTaxValidation = () =>
  validate({
    body: Joi.object({
      userId: Joi.string().required(),
      name: Joi.string().required(),
      description: Joi.string().optional(),
      rate: Joi.number().min(0).max(100).required(),
      location: Joi.string().optional(),
      applyToCheckout: Joi.boolean().default(false),
    }),
  });

export const updateTaxValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
    body: Joi.object({
      userId: Joi.forbidden(),
      name: Joi.string().optional(),
      description: Joi.string().optional(),
      rate: Joi.number().min(0).max(100).optional(),
      location: Joi.string().optional(),
      applyToCheckout: Joi.boolean().optional(),
    }),
  });

export const deleteTaxValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
  });
