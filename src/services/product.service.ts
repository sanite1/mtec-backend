import {
  AdjustQuantityPayload,
  CreateProductRequest,
} from "../interfaces/product.interface";
import ApiResponse from "../errors/apiResponse";
import { Product, ProductHistory, ProductVariation } from "../models/product";
import mongoose, { FilterQuery } from "mongoose";
import { ProductFilterParams } from "../interfaces/product.interface";
import ApiError from "../errors/apiError";
import User from "../models/User";

export const createProductService = async (data: CreateProductRequest) => {
  // 1️⃣ Create the product
  const product = await Product.create({
    userId: data.userId,
    name: data.name,
    sku: data.sku,
    description: data.description,
    price: data.price,
    collection: data.collection,
    images: data.images,
    totalStock: data.variations
      ? data.variations.reduce((sum, v) => sum + (v.stock || 0), 0)
      : 0,
  });

  // 2️⃣ Create variations if provided
  let variations: any[] = [];
  if (data.variations && data.variations.length > 0) {
    variations = await ProductVariation.insertMany(
      data.variations.map((v) => ({
        ...v,
        productId: product._id,
      }))
    );
  }

  // 3️⃣ Create a product history record
  await ProductHistory.create({
    productId: product._id,
    source: "Admin",
    activity: "added",
    qtyBefore: 0,
    qtyChange: product.totalStock,
    qtyAfter: product.totalStock,
  });

  return new ApiResponse(201, "Product created successfully", {
    product,
    variations,
  });
};

export const getProductsByUserService = async ({
  userId,
  collection,
  name,
  isActive,
  page = 1,
  limit = 20,
}: ProductFilterParams) => {
  const filters: any = { userId };

  if (collection) filters.collection = collection;
  if (name) filters.name = { $regex: name, $options: "i" }; // case-insensitive search
  if (typeof isActive === "boolean") filters.isActive = isActive;

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filters).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Product.countDocuments(filters),
  ]);

  if (!products.length) {
    throw new ApiError(404, "No products found for this user");
  }
  return new ApiResponse(200, "Products Retrieved Successfully", {
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    products,
  });
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
  updateData: any
) => {
  // 1️⃣ Find product
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // 2️⃣ Update main product fields
  const allowedFields = [
    "name",
    "description",
    "price",
    "collection",
    "isActive",
    "images",
  ];

  for (const key of allowedFields) {
    if (key in updateData) {
      (product as any)[key] = updateData[key];
    }
  }

  // 3️⃣ Handle variations update (if any)
  let updatedVariations: any = [];
  if (updateData.variations && updateData.variations.length > 0) {
    const existingVariations = await ProductVariation.find({
      productId: product._id,
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const variation of updateData.variations) {
        if (variation._id) {
          // Update existing variation
          await ProductVariation.findByIdAndUpdate(
            variation._id,
            {
              name: variation.name,
              sku: variation.sku,
              price: variation.price,
              stock: variation.stock,
            },
            { new: true, session }
          );
        } else {
          // Create new variation
          const newVar = await ProductVariation.create(
            [{ ...variation, productId: product._id }],
            { session }
          );
          updatedVariations.push(newVar[0]);
        }
      }

      // recalc totalStock
      const allVariations = await ProductVariation.find({
        productId: product._id,
      });
      product.totalStock = allVariations.reduce(
        (sum, v) => sum + (v.stock || 0),
        0
      );

      await product.save({ session });
      await session.commitTransaction();
      session.endSession();

      updatedVariations = await ProductVariation.find({ productId });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } else {
    await product.save();
  }

  // 4️⃣ Return updated data
  return new ApiResponse(200, "Product updated successfully", {
    product,
    variations:
      updatedVariations.length > 0
        ? updatedVariations
        : await ProductVariation.find({ productId }),
  });
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

    // 2️⃣ Ensure variation exists
    if (!variationId)
      throw new ApiError(
        400,
        "Please specify a variationId to adjust quantity"
      );

    const variation =
      await ProductVariation.findById(variationId).session(session);
    if (!variation) throw new ApiError(404, "Product variation not found");

    // 3️⃣ Get total stock before adjustment
    const allVariationsBefore = await ProductVariation.find({
      productId: product._id,
    }).session(session);
    const qtyBefore = allVariationsBefore.reduce((sum, v) => sum + v.stock, 0);

    // 4️⃣ Determine adjustment
    let adjustment = 0;
    if (type === "added") adjustment = quantity;
    else if (type === "removed") adjustment = -quantity;
    else if (type === "returned") adjustment = quantity;

    // 5️⃣ Update the specific variation stock
    variation.stock = Math.max(0, variation.stock + adjustment);
    await variation.save({ session });

    // 6️⃣ Recalculate total product stock after change
    const allVariationsAfter = await ProductVariation.find({
      productId: product._id,
    }).session(session);

    const qtyAfter = allVariationsAfter.reduce((sum, v) => sum + v.stock, 0);

    product.totalStock = qtyAfter;
    await product.save({ session });

    // 7️⃣ Log in ProductHistory
    await ProductHistory.create(
      [
        {
          productId: product._id,
          source,
          activity: type, // "added" | "removed" | "returned"
          qtyBefore,
          qtyChange: quantity,
          qtyAfter,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // ✅ Response
    return new ApiResponse(200, "Product quantity updated successfully", {
      productId: product._id,
      variationId: variation._id,
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
      await product.save({ session });

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
  page: number,
  limit: number
) => {
  // 1️⃣ Ensure product exists
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  // 2️⃣ Fetch history with pagination
  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    ProductHistory.find({ productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ProductHistory.countDocuments({ productId }),
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
