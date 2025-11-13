import { Joi, validate } from "express-validation";

export const getLocationValidation = () =>
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

export const createLocationValidation = () =>
  validate({
    body: Joi.object({
      userId: Joi.string().required(),
      name: Joi.string().required(),
      description: Joi.string().optional(),
      address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      country: Joi.string().required(),
    }),
  });

export const updateLocationValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
    body: Joi.object({
      userId: Joi.forbidden(),
      name: Joi.string().required(),
      description: Joi.string().optional(),
      address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      country: Joi.string().required(),
    }),
  });

export const deleteLocationValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
  });
