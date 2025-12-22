import { Joi, validate } from "express-validation";

export const initializePaymentValidation = () =>
  validate({
    params: Joi.object({
      orderId: Joi.string().required(),
    }),
  });

export const getPaymentValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
    query: Joi.object({
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(10),
      status: Joi.string()
        .valid("pending", "paid", "failed", "refunded")
        .optional(),
      search: Joi.string().allow("", null).optional(), // orderNumber or customer name
      channel: Joi.string().optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
    }),
  });

export const getPaymentStatsValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
  });

export const withdrawValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
  });
