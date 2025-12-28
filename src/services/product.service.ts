import {
  AdjustQuantityPayload,
  CreateProductRequest,
} from "../interfaces/product.interface";
import ApiResponse from "../errors/apiResponse";
import { Product, ProductHistory, ProductVariation } from "../models/product";
import mongoose, { FilterQuery, PipelineStage, Types } from "mongoose";
import { ProductFilterParams } from "../interfaces/product.interface";
import ApiError from "../errors/apiError";
import User from "../models/User";
import { createLowStockTodo } from "./todo.service";
import { Todo } from "../models/todo";

export const createProductService = async (data: CreateProductRequest) => {
  const hasVariations =
    Array.isArray(data.variations) && data.variations.length > 0;

  // 1️⃣ Create product
  const totalStock = hasVariations
    ? data?.variations?.reduce(
        (sum, v) => Number(sum) + (Number(v.stock) || 0),
        0
      )
    : data.totalStock || 0;

  let priceValue: number | { min: number; max: number } | undefined =
    data.price;

  if (hasVariations) {
    const prices = data?.variations
      ?.map((v) => Number(v.price))
      .filter((p) => !isNaN(p));

    if (prices?.length && prices?.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      priceValue = min === max ? min : { min, max };
    } else {
      priceValue = undefined;
    }
  }

  let priceRange: any;
  if (typeof priceValue === "object" && priceValue !== null) {
    // You can safely access min and max here
    priceRange = `${priceValue.min} - ${priceValue.max}`;
  } else if (typeof priceValue === "number") {
    priceRange = `${priceValue}`;
  }

  const product = await Product.create({
    userId: data.userId,
    name: data.name,
    sku: data.sku,
    description: data.description,
    location: data.location,
    locationName: data.locationName,
    costPrice: hasVariations ? undefined : data.costPrice,
    discountPrice: hasVariations ? undefined : data.discountPrice,
    unit: data.unit,
    price: hasVariations ? undefined : data.price,
    ...(priceRange !== undefined && { priceRange }),
    category: data.category,
    variantsOptionGroup: data.variantsOptionGroup,
    images: data.images,
    totalStock,
  });

  // 2️⃣ Create variations (if any)
  let variations: any[] = [];
  if (hasVariations) {
    variations = await ProductVariation.insertMany(
      data?.variations?.map((v) => ({
        ...v,
        productId: product._id,
      }))
    );
  }

  // 3️⃣ Record history
  await ProductHistory.create({
    productId: product._id,
    source: "Admin",
    activity: "added",
    qtyBefore: 0,
    qtyChange: totalStock,
    qtyAfter: totalStock,
  });

  return new ApiResponse(201, "Product created successfully", {
    product,
    variations,
  });
};

export const getProductsByUserService = async ({
  userId,
  category,
  search,
  location,
  isActive,
  page = 1,
  limit = 10,
}: ProductFilterParams) => {
  try {
    const match: any = { userId: new Types.ObjectId(userId) };

    if (location) match.locationName = location.trim();
    if (category) match.category = category;
    if (search) match.name = { $regex: search, $options: "i" };
    if (typeof isActive === "boolean") match.isActive = isActive;

    const skip = (page - 1) * limit;

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $sort: {
          createdAt: -1 as const,
        },
      },
      {
        $lookup: {
          from: "productvariations",
          localField: "_id",
          foreignField: "productId",
          as: "variations",
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Product.aggregate(pipeline);

    // 🛑 Defensive checks
    if (!result || !result.length) {
      return new ApiResponse(200, "Products Retrieved Successfully", {
        total: 0,
        currentPage: page,
        totalPages: 0,
        products: [],
      });
    }

    const products = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    return new ApiResponse(200, "Products Retrieved Successfully", {
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (error: any) {
    // ❗ Structured error logging
    console.error("❌ getProductsByUserService failed", {
      message: error.message,
      stack: error.stack,
      userId,
      page,
      limit,
    });

    // Let your global error handler catch this
    throw new Error("Failed to retrieve products");
  }
};

export const getSingleProductService = async (
  userId: string,
  productId: string
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  if (product.userId.toString() !== userId.toString()) {
    throw new Error(
      "Unauthorized access — product does not belong to this user"
    );
  }

  const variations = await ProductVariation.find({ productId });

  return new ApiResponse(200, "Product Details Retrieved Successfully", {
    ...product.toObject(),
    variations,
  });
};

export const updateProductService = async (
  productId: string,
  updateData: CreateProductRequest | any
) => {
  // 1️⃣ Find existing product
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  // Snapshot previous totalStock for history entry later
  const prevTotalStock = product.totalStock || 0;

  // Determine whether incoming payload has variations
  const hasVariations =
    Array.isArray(updateData.variations) && updateData.variations.length > 0;

  // Compute new totalStock
  const newTotalStock = hasVariations
    ? updateData.variations.reduce(
        (sum: number, v: any) => sum + (Number(v.stock) || 0),
        0
      )
    : typeof updateData.totalStock !== "undefined"
      ? Number(updateData.totalStock)
      : product.totalStock;

  // Compute priceValue / priceRange (same logic as create)
  let priceValue: number | { min: number; max: number } | undefined =
    updateData.price ?? product.price;

  if (hasVariations) {
    const prices = (updateData?.variations ?? [])
      .map((v: any) => Number(v.price))
      .filter((p: number) => !isNaN(p));

    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      priceValue = min === max ? min : { min, max };
    } else {
      priceValue = undefined;
    }
  }

  let priceRange: string | undefined;
  if (typeof priceValue === "object" && priceValue !== null) {
    priceRange = `${priceValue.min} - ${priceValue.max}`;
  } else if (typeof priceValue === "number") {
    priceRange = `${priceValue}`;
  }

  // Build product update payload (only allowed/expected fields)
  const updateFields: any = {};

  const allowedScalars = [
    "name",
    "description",
    "location",
    "locationName",
    "unit",
    "category",
    "images",
    "isActive",
  ];

  for (const key of allowedScalars) {
    if (key in updateData) updateFields[key] = updateData[key];
  }

  // Pricing & stock handling depending on variations
  if (hasVariations) {
    // When variations exist, product-level price/cost/discount should be unset
    updateFields.price = undefined;
    updateFields.costPrice = undefined;
    updateFields.discountPrice = undefined;
    if (priceRange !== undefined) updateFields.priceRange = priceRange;
    else updateFields.priceRange = undefined;
  } else {
    // No variations -> accept top level price/cost/discount if present in payload
    if ("price" in updateData) updateFields.price = updateData.price;
    if ("costPrice" in updateData)
      updateFields.costPrice = updateData.costPrice;
    if ("discountPrice" in updateData)
      updateFields.discountPrice = updateData.discountPrice;
    // Remove priceRange for non-variation product
    updateFields.priceRange = undefined;
  }

  // totalStock always set to newTotalStock
  updateFields.totalStock = newTotalStock;

  // variantsOptionGroup can be updated directly
  if ("variantsOptionGroup" in updateData) {
    updateFields.variantsOptionGroup = updateData.variantsOptionGroup;
  }

  // Begin transaction when doing destructive modification (variations)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2️⃣ If hasVariations, delete existing variations and recreate
    let createdVariations: any[] = [];
    if (hasVariations) {
      // Remove all existing variations for this product
      await ProductVariation.deleteMany({ productId: product._id }).session(
        session
      );

      // Insert new variations (map productId)
      if (updateData.variations && updateData.variations.length > 0) {
        const mapped = updateData.variations.map((v: any) => ({
          ...v,
          productId: product._id,
        }));

        createdVariations = await ProductVariation.insertMany(mapped, {
          session,
        });
      }
    } else {
      // If payload has no variations and product previously had variations, delete them
      if (!hasVariations) {
        await ProductVariation.deleteMany({ productId: product._id }).session(
          session
        );
      }
    }

    // 3️⃣ Apply product updates and save
    // Merge updateFields into product doc
    Object.keys(updateFields).forEach((k) => {
      // If explicitly undefined, unset field in doc
      if (typeof updateFields[k] === "undefined") {
        // Use delete so mongoose will unset on save
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (product as any)[k];
      } else {
        (product as any)[k] = updateFields[k];
      }
    });

    await product.save({ session }).then(async (savedProduct) => {
      if (savedProduct.totalStock <= 3) {
        createLowStockTodo({
          userId: String(savedProduct.userId),
          productId: String(savedProduct._id),
          productName: savedProduct.name,
          currentStock: savedProduct.totalStock,
        });
      } else {
        await Todo.deleteMany({
          userId: String(savedProduct.userId),
          "metadata.productId": String(savedProduct._id),
          type: "low_stock",
        });
      }
    });

    // 4️⃣ Create a history record if totalStock changed
    const qtyBefore = prevTotalStock;
    const qtyAfter = newTotalStock;
    const qtyChange = qtyAfter - qtyBefore;

    if (qtyChange !== 0) {
      const activity: "added" | "removed" = qtyChange > 0 ? "added" : "removed";

      await ProductHistory.create(
        [
          {
            productId: product._id,
            source: updateData.source || "Admin",
            activity,
            qtyBefore,
            qtyChange: Math.abs(qtyChange),
            qtyAfter,
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    // 5️⃣ Return latest product and variations
    const finalProduct = await Product.findById(product._id);
    const finalVariations = await ProductVariation.find({
      productId: product._id,
    });

    return new ApiResponse(200, "Product updated successfully", {
      product: finalProduct,
      variations: finalVariations,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const deleteProductService = async (productId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Check if product exists
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // 2️⃣ Delete related variations and history
    await ProductVariation.deleteMany({ productId }).session(session);
    await ProductHistory.deleteMany({ productId }).session(session);

    // 3️⃣ Delete the product itself
    await Product.findByIdAndDelete(productId).session(session);

    // 4️⃣ Commit transaction
    await session.commitTransaction();
    session.endSession();

    return new ApiResponse(200, "Product deleted successfully", {
      productId,
      status: "removed",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const adjustProductQuantityService = async (
  productId: string,
  { type, variationId, quantity, source = "manual" }: AdjustQuantityPayload
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Find product
    const product = await Product.findById(productId).session(session);
    if (!product) throw new ApiError(404, "Product not found");

    // 2️⃣ Calculate adjustment amount
    let adjustment = 0;
    if (type === "added") adjustment = quantity;
    else if (type === "removed") adjustment = -quantity;
    else if (type === "returned") adjustment = quantity;
    else throw new ApiError(400, "Invalid quantity adjustment type");

    // --- Case 1: Product has variations ---
    // if (product?.variantsOptionGroup?.length === 0) {
    //   if (!variationId)
    //     throw new ApiError(400, "Variation ID required for this product");

    //   const variation =
    //     await ProductVariation.findById(variationId).session(session);
    //   if (!variation) throw new ApiError(404, "Product variation not found");

    //   // Get total stock before change
    //   const allVariationsBefore = await ProductVariation.find({
    //     productId: product._id,
    //   }).session(session);
    //   const qtyBefore = allVariationsBefore.reduce(
    //     (sum, v) => sum + v.stock,
    //     0
    //   );

    //   // Apply change to variation
    //   variation.stock = Math.max(0, variation.stock + adjustment);
    //   await variation.save({ session });

    //   // Get total stock after change
    //   const allVariationsAfter = await ProductVariation.find({
    //     productId: product._id,
    //   }).session(session);
    //   const qtyAfter = allVariationsAfter.reduce((sum, v) => sum + v.stock, 0);

    //   // Update total stock
    //   product.totalStock = qtyAfter;
    //   await product.save({ session });

    //   // Log in history
    //   await ProductHistory.create(
    //     [
    //       {
    //         productId: product._id,
    //         variationId,
    //         source,
    //         activity: type,
    //         qtyBefore,
    //         qtyChange: quantity,
    //         qtyAfter,
    //       },
    //     ],
    //     { session }
    //   );

    //   await session.commitTransaction();
    //   session.endSession();

    //   return new ApiResponse(
    //     200,
    //     "Product variation quantity updated successfully",
    //     {
    //       productId: product._id,
    //       variationId,
    //       activity: type,
    //       source,
    //       qtyBefore,
    //       qtyChange: quantity,
    //       qtyAfter,
    //       totalStock: qtyAfter,
    //     }
    //   );
    // }

    // --- Case 2: Product has no variations ---
    const qtyBefore = product.totalStock || 0;
    const qtyAfter = Math.max(0, qtyBefore + adjustment);

    product.totalStock = qtyAfter;
    await product.save({ session }).then(async (savedProduct) => {
      if (savedProduct.totalStock <= 3) {
        createLowStockTodo({
          userId: String(savedProduct.userId),
          productId: String(savedProduct._id),
          productName: savedProduct.name,
          currentStock: savedProduct.totalStock,
        });
      } else {
        await Todo.deleteMany({
          userId: String(savedProduct.userId),
          "metadata.productId": String(savedProduct._id),
          type: "low_stock",
        });
      }
    });

    // Log in history
    await ProductHistory.create(
      [
        {
          productId: product._id,
          source,
          activity: type,
          qtyBefore,
          qtyChange: quantity,
          qtyAfter,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return new ApiResponse(200, "Product quantity updated successfully", {
      productId: product._id,
      activity: type,
      source,
      qtyBefore,
      qtyChange: quantity,
      qtyAfter,
      totalStock: qtyAfter,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const updateProductVariationService = async (
  productId: string,
  varId: string,
  updateData: { name?: string; sku?: string; price?: number; stock?: number }
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Verify product exists
    const product = await Product.findById(productId).session(session);
    if (!product) throw new ApiError(404, "Product not found");

    // 2️⃣ Verify variation exists
    const variation = await ProductVariation.findById(varId).session(session);
    if (!variation) throw new ApiError(404, "Product variation not found");

    // 3️⃣ Track stock before change
    const oldStock = variation.stock;

    // 4️⃣ Update variation fields
    Object.assign(variation, updateData);
    await variation.save({ session });

    // 5️⃣ If stock changed, update product total and log in history
    if (updateData.stock !== undefined && updateData.stock !== oldStock) {
      // Recalculate total stock
      const allVariations = await ProductVariation.find({
        productId: product._id,
      }).session(session);

      const totalStock = allVariations.reduce((sum, v) => sum + v.stock, 0);

      const qtyBefore = product.totalStock;
      const qtyChange = updateData.stock - oldStock;
      const qtyAfter = totalStock;

      product.totalStock = totalStock;
      await product.save({ session }).then(async (savedProduct) => {
        if (savedProduct.totalStock <= 3) {
          createLowStockTodo({
            userId: String(savedProduct.userId),
            productId: String(savedProduct._id),
            productName: savedProduct.name,
            currentStock: savedProduct.totalStock,
          });
        } else {
          await Todo.deleteMany({
            userId: String(savedProduct.userId),
            "metadata.productId": String(savedProduct._id),
            type: "low_stock",
          });
        }
      });

      await ProductHistory.create(
        [
          {
            productId: product._id,
            source: "manual",
            activity:
              qtyChange > 0 ? "added" : qtyChange < 0 ? "removed" : "returned",
            qtyBefore,
            qtyChange: Math.abs(qtyChange),
            qtyAfter,
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return new ApiResponse(200, "Product variation updated successfully", {
      productId: product._id,
      variationId: variation._id,
      updatedFields: updateData,
      totalStock: product.totalStock,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getProductHistoryService = async (
  productId: string,
  activity: string,
  page: number,
  limit: number
) => {
  const filters: any = { productId };

  if (activity) filters.activity = activity.trim();
  // 1️⃣ Ensure product exists
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  // 2️⃣ Fetch history with pagination
  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    ProductHistory.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ProductHistory.countDocuments(filters),
  ]);

  // 3️⃣ Return response
  return new ApiResponse(200, "Product history fetched successfully", {
    total,
    page,
    limit,
    history: entries,
  });
};

export const resetProductHistoryService = async (productId: string) => {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  const deletedCount = await ProductHistory.deleteMany({ productId });

  return new ApiResponse(200, "Product history cleared successfully", {
    productId,
    deletedCount: deletedCount.deletedCount || 0,
  });
};

export const getProductStatsService = async (userId: string) => {
  // 1) Ensure user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // 2) Aggregate product stats
  const result = await Product.aggregate([
    {
      $match: { userId: new Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: {
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
        },
        inactiveProducts: {
          $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
        },
        totalStock: { $sum: { $ifNull: ["$totalStock", 0] } },
      },
    },
  ]);

  const stats = result[0] || {
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    totalStock: 0,
  };

  return new ApiResponse(200, "Product statistics retrieved successfully", {
    totalProducts: stats.totalProducts,
    activeProducts: stats.activeProducts,
    inactiveProducts: stats.inactiveProducts,
    totalStock: stats.totalStock,
  });
};

export const getProductRetailValueService = async (userId: string) => {
  // Ensure user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const result = await ProductVariation.aggregate([
    // Join products to access userId
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },

    // Filter by merchant
    {
      $match: {
        "product.userId": new Types.ObjectId(userId),
      },
    },

    // Compute retail & cost values
    {
      $group: {
        _id: null,
        totalRetailValue: {
          $sum: {
            $multiply: [
              "$stock",
              {
                $cond: [
                  { $ifNull: ["$discountPrice", false] },
                  "$discountPrice",
                  "$price",
                ],
              },
            ],
          },
        },
        totalCostValue: {
          $sum: {
            $multiply: ["$stock", { $ifNull: ["$costPrice", 0] }],
          },
        },
        totalVariationStock: { $sum: "$stock" },
      },
    },
  ]);

  const stats = result[0] || {
    totalRetailValue: 0,
    totalCostValue: 0,
    totalVariationStock: 0,
  };

  return new ApiResponse(
    200,
    "Product value statistics retrieved successfully",
    {
      totalRetailValue: stats.totalRetailValue,
      totalCostValue: stats.totalCostValue,
      totalVariationStock: stats.totalVariationStock,
    }
  );
};

export const getFullProductStatsService = async (userId: string) => {
  const [productStats, valueStats] = await Promise.all([
    getProductStatsService(userId),
    getProductRetailValueService(userId),
  ]);

  return new ApiResponse(200, "Product dashboard stats retrieved", {
    ...productStats.data,
    ...valueStats.data,
  });
};
