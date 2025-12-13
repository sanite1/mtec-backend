import { Joi, validate } from "express-validation";

export const initializePaymentValidation = () =>
  validate({
    params: Joi.object({
      //   userId: Joi.string().required(),
      orderId: Joi.string().required(),
    }),
  });
