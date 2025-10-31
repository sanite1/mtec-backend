import { Joi, validate } from "express-validation";

export const createCustomerValidation = () =>
  validate({
    body: Joi.object({
      userId: Joi.string().required(),

      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().optional(),
      email: Joi.string().email().optional(),
      additionalInfo: Joi.string().optional(),
      newsletterSubscribed: Joi.boolean().optional(),

      shipping: Joi.object({
        address: Joi.string().optional(),
        country: Joi.string().required(),
        state: Joi.string().optional(),
        city: Joi.string().optional(),
        zip: Joi.string().optional(),
      }).required(),

      billing: Joi.object({
        sameAsShipping: Joi.boolean().default(false),
        address: Joi.string().optional(),
        country: Joi.string().optional(),
        state: Joi.string().optional(),
        city: Joi.string().optional(),
        zip: Joi.string().optional(),
      }).required(),
    }),
  });

export const getCustomersValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),

    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).optional(),

      search: Joi.string().allow("").optional(),

      // newsletter filter: subscribed=true
      subscribed: Joi.string().valid("true", "false").optional(),

      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
    }),
  });

export const getCustomerByIdValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
  });

export const updateCustomerValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),

    body: Joi.object({
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      phone: Joi.string().optional(),
      email: Joi.string().email().optional(),
      additionalInfo: Joi.string().optional(),
      newsletterSubscribed: Joi.boolean().optional(),
      // ❌ userId should not be updated by client
      userId: Joi.forbidden(),

      shipping: Joi.object({
        address: Joi.string().optional(),
        country: Joi.string().optional(),
        state: Joi.string().optional(),
        city: Joi.string().optional(),
        zip: Joi.string().optional(),
      }).optional(),

      billing: Joi.object({
        sameAsShipping: Joi.boolean().default(true),

        address: Joi.alternatives().conditional("sameAsShipping", {
          is: false,
          then: Joi.string().required(),
          otherwise: Joi.forbidden(),
        }),

        country: Joi.alternatives().conditional("sameAsShipping", {
          is: false,
          then: Joi.string().required(),
          otherwise: Joi.forbidden(),
        }),
        state: Joi.alternatives().conditional("sameAsShipping", {
          is: false,
          then: Joi.string().required(),
          otherwise: Joi.forbidden(),
        }),
        city: Joi.alternatives().conditional("sameAsShipping", {
          is: false,
          then: Joi.string().required(),
          otherwise: Joi.forbidden(),
        }),
        zip: Joi.alternatives().conditional("sameAsShipping", {
          is: false,
          then: Joi.string().required(),
          otherwise: Joi.forbidden(),
        }),
      }).optional(),
    }),
  });

export const deleteCustomerValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
      userId: Joi.string().required(),
    }),
  });

export const updateNewsletterValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(), // customer ID
    }),

    body: Joi.object({
      userId: Joi.string().required(), // store owner ID
      newsletterSubscribed: Joi.boolean().required(),
    }),
  });

export const getCustomerOrdersValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(), // customerId
      userId: Joi.string().required(), // store owner ID
    }),
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      search: Joi.string().optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
    }),
  });

export const getCustomerStatsValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
  });
