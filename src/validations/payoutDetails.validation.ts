import { Joi, validate } from "express-validation";

export const createPayoutDetailsValidation = () =>
  validate({
    body: Joi.object({
      userId: Joi.string().required(),
      accountName: Joi.string().required(),
      accountNumber: Joi.string().required(),
      bankName: Joi.string().required(),
      allowCustomerCharges: Joi.boolean().required(),
      acceptTerms: Joi.boolean().required(),
    }),
  });

export const updatePayoutDetailsValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),

    body: Joi.object({
      userId: Joi.string().forbidden(),
      accountName: Joi.string().required(),
      accountNumber: Joi.string().required(),
      bankName: Joi.string().required(),
      allowCustomerCharges: Joi.boolean().required(),
      acceptTerms: Joi.boolean().required(),
    }),
  });

export const getPayoutDetailsValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
  });

export const deletePayoutDetailsValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
  });
