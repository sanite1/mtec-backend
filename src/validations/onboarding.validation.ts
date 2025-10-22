import { Joi, validate } from "express-validation";

export const getOnboardingSchema = {
  params: Joi.object({
    userId: Joi.string().hex().length(24).required(), // Valid MongoDB ObjectId
  }),
};

export const updateOnboardingStepSchema = {
  params: Joi.object({
    key: Joi.string()
      .valid(
        "storeDetails",
        "products",
        "shipping",
        "payout",
        "preview",
        "trial"
      )
      .required(),
  }),
  body: Joi.object({
    userId: Joi.string().hex().length(24).required(),
    completed: Joi.boolean().required(),
  }),
};

export const resetOnboardingSchema = {
  body: Joi.object({
    userId: Joi.string().hex().length(24).required(), // Valid MongoDB ObjectId
  }),
};

export const getOnboardingValidation = () => {
  return validate(
    getOnboardingSchema,
    { context: true },
    { abortEarly: false }
  );
};

export const updateOnboardingStepValidation = () => {
  return validate(
    updateOnboardingStepSchema,
    { context: true },
    { abortEarly: false }
  );
};

export const resetOnboardingValidation = () => {
  return validate(
    resetOnboardingSchema,
    { context: true },
    { abortEarly: false }
  );
};
