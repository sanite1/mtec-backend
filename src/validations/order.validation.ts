import { Joi, validate } from "express-validation";

export const createOrderValidation = () =>
  validate({
    body: Joi.object({
      userId: Joi.string().required(),
      customerId: Joi.string().optional(),
      channel: Joi.string().required(),
      items: Joi.array()
        .items(
          Joi.object({
            productId: Joi.string().required(),
            variationId: Joi.string().optional(),
            price: Joi.number().optional(),
            name: Joi.string().optional(),
            sku: Joi.string().optional(),
            quantity: Joi.number().integer().min(1).required(),
          })
        )
        .min(1)
        .required(),
      shippingAddress: Joi.object({
        fullName: Joi.string().required(),
        phone: Joi.string().required(),
        email: Joi.string().required(),
        addressLine1: Joi.string().required(),
        addressLine2: Joi.string().optional(),
        city: Joi.string().required(),
        state: Joi.string().optional(),
        country: Joi.string().required(),
      }).required(),
      note: Joi.string().optional(),
      discount: Joi.number().min(0).optional(),
      tax: Joi.number().min(0).optional(),
      shippingFee: Joi.number().min(0).optional(),
      paymentStatus: Joi.string()
        .valid("unpaid", "paid", "refunded")
        .optional(),
      paymentMethod: Joi.string()
        .valid("card", "bank_transfer", "cash", "other")
        .optional(),
      orderStatus: Joi.string()
        .valid("pending", "completed", "cancelled", "refunded")
        .optional(),
      shippingStatus: Joi.string()
        .valid("pending", "processing", "delivered", "shipped")
        .optional(),
    }),
  });

export const getOrdersValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
    query: Joi.object({
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(20),
      status: Joi.string()
        .valid("pending", "completed", "cancelled", "refunded")
        .optional(),
      paymentStatus: Joi.string()
        .valid("unpaid", "paid", "refunded")
        .optional(),
      paymentMethod: Joi.string()
        .valid("card", "bank_transfer", "cash", "other")
        .optional(),
      search: Joi.string().allow("", null).optional(), // orderNumber or customer name
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
    }),
  });

export const getSingleOrderValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
  });

export const getOrderStatsValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
    }),
  });

export const cancelOrderValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(), // Order ID
    }),
  });

export const updateOrderStatusValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
    body: Joi.object({
      status: Joi.string()
        .valid("pending", "completed", "cancelled", "refunded")
        .required(),
    }),
  });

export const updatePaymentStatusValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
    body: Joi.object({
      paymentStatus: Joi.string()
        .valid("unpaid", "paid", "refunded")
        .required(),
    }),
  });

export const updateShippingStatusValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
    body: Joi.object({
      shippingStatus: Joi.string()
        .valid("pending", "processing", "shipped", "delivered")
        .required(),
    }),
  });

export const requestPaymentValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
  });
