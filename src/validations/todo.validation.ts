import { Joi, validate } from "express-validation";

export const getTodosValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
  });
