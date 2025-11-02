import { validate } from "express-validation";
import Joi from "joi";

export const getStorefrontValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
  });
