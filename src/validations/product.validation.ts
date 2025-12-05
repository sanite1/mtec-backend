import { Joi, validate } from "express-validation";

export const createProductValidation = () => {
  return validate({
    body: Joi.object({
      userId: Joi.string().required(),
      name: Joi.string().min(2).required(),
      sku: Joi.string().required(),
      description: Joi.string().optional(),
      location: Joi.string().required(),
      locationName: Joi.string().required(),
      unit: Joi.string().required(),
      category: Joi.string().optional(),
      images: Joi.array().items(Joi.string().uri()).optional(),
      price: Joi.number().optional(),
      costPrice: Joi.number().optional(),
      discountPrice: Joi.number().optional(),
      totalStock: Joi.number().optional(),
      // Variations schema
      variations: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            sku: Joi.string().required(),
            price: Joi.number().required(),
            costPrice: Joi.number().optional(),
            discountPrice: Joi.number().optional(),
            stock: Joi.number().default(0),
          })
        )
        .optional(),

      // 🧠 Variants Option Groups array
      variantsOptionGroup: Joi.array()
        .items(
          Joi.object({
            id: Joi.string().required(),
            name: Joi.string().required(),
            values: Joi.array()
              .items(
                Joi.object({
                  id: Joi.string().required(),
                  value: Joi.string().required(),
                })
              )
              .min(1)
              .required(),
          })
        )
        .optional(),
    }),
  });
};

export const getProductsValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(), // the user's ID
    }),
    query: Joi.object({
      category: Joi.string().optional(),
      location: Joi.string().optional(),
      search: Joi.string().optional(),
      isActive: Joi.boolean().optional(),
      page: Joi.number().default(1),
      limit: Joi.number().default(20),
    }),
  });

export const getSingleProductValidation = () =>
  validate({
    params: Joi.object({
      userId: Joi.string().required(),
      productId: Joi.string().required(),
    }),
  });
export const updateProductValidation = () =>
  validate({
    body: Joi.object({
      userId: Joi.string().required(),
      name: Joi.string().min(2).required(),
      sku: Joi.string().required(),
      description: Joi.string().optional(),
      location: Joi.string().optional(),
      locationName: Joi.string().optional(),
      unit: Joi.string().required(),
      category: Joi.string().optional(),
      images: Joi.array().items(Joi.string().uri()).optional(),
      price: Joi.number().optional(),
      costPrice: Joi.number().optional(),
      discountPrice: Joi.number().optional(),
      totalStock: Joi.number().optional(),
      // Variations schema
      variations: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            sku: Joi.string().required(),
            price: Joi.number().required(),
            costPrice: Joi.number().optional(),
            discountPrice: Joi.number().optional(),
            stock: Joi.number().default(0),
          })
        )
        .optional(),

      // 🧠 Variants Option Groups array
      variantsOptionGroup: Joi.array()
        .items(
          Joi.object({
            id: Joi.string().required(),
            name: Joi.string().required(),
            values: Joi.array()
              .items(
                Joi.object({
                  id: Joi.string().required(),
                  value: Joi.string().required(),
                })
              )
              .min(1)
              .required(),
          })
        )
        .optional(),
    }),
  });
export const deleteProductValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(), // productId
    }),
  });

export const adjustQuantityValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required(), // productId
    }),
    body: Joi.object({
      type: Joi.string().valid("added", "removed", "returned").required(),
      variationId: Joi.string().optional(), // optional, if adjusting a specific variation
      quantity: Joi.number().integer().min(1).required(),
      note: Joi.string().optional(), // optional note for audit
    }),
  });

export const updateProductVariationValidation = () =>
  validate({
    params: Joi.object({
      productId: Joi.string().required(),
      varId: Joi.string().required(),
    }),
    body: Joi.object({
      name: Joi.string().optional(),
      sku: Joi.string().optional(),
      price: Joi.number().optional(),
      stock: Joi.number().optional(),
    }).min(1), // must provide at least one field
  });

export const getProductHistoryValidation = () =>
  validate({
    params: Joi.object({
      productId: Joi.string().required(),
    }),
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
  });

export const resetProductHistoryValidation = () =>
  validate({
    params: Joi.object({
      id: Joi.string().required().messages({
        "any.required": "Product ID is required",
        "string.empty": "Product ID cannot be empty",
      }),
    }),
  });
