import { Joi, validate } from "express-validation";

export const getDashboardSummaryValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
  });

export const getSalesOverviewDataValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
    query: Joi.object({
      filter: Joi.string()
        .valid("this_month", "3_months", "6_months", "1_year")
        .required(),
    }),
  });
