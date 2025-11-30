import { Joi, validate } from "express-validation";

export const getDiscountValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).optional(),
      search: Joi.string().allow("").optional(),
      startDate: Joi.date().optional(),
      location: Joi.string().optional(),
      endDate: Joi.date().optional(),
    }),
  });

export const createDiscountValidation = () =>
  validate({
    body: Joi.object({
      userId: Joi.string().required(),
      description: Joi.string().optional(),
      discountName: Joi.string().required(),
      discountType: Joi.string().valid("percentage", "fixed").required(),
      discountValue: Joi.number().required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      location: Joi.string().required(),
      locationName: Joi.string().required(),
      products: Joi.array()
        .items(
          Joi.object({
            productId: Joi.string().required(),
            name: Joi.string().required(),
            price: Joi.string().required(),
            // products: Joi.array().items(Joi.string()).optional(),
          })
        )
        .optional(),
    }),
  });

export const updateDiscountValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
    body: Joi.object({
      userId: Joi.forbidden(),
      description: Joi.string().optional(),
      discountName: Joi.string().optional(),
      discountType: Joi.string().valid("percentage", "fixed").optional(),
      discountValue: Joi.number().optional(),
      startDate: Joi.date().optional(),
      location: Joi.string().optional(),
      endDate: Joi.date().optional(),
      products: Joi.array()
        .items(
          Joi.object({
            productId: Joi.string().required(),
            name: Joi.string().required(),
            price: Joi.number().required(),
            // products: Joi.array().items(Joi.string()).optional(),
          })
        )
        .optional(),
    }),
  });

export const deleteDiscountValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
  });

export const getDiscountStatsValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
  });

export const verifyDiscountValidation = () =>
  validate({
    body: Joi.object({
      discountName: Joi.string().required(),
      location: Joi.string().required(),
    }),
  });
