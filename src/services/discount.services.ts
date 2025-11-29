import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import User from "../models/User";
import {
  CreateDiscountRequest,
  GetDiscountParams,
  UpdateDiscountRequest,
} from "../interfaces/discount.interface";
import Discount from "../models/discount";
import { Types } from "mongoose";

export const getDiscountsService = async ({
  userId,
  page = 1,
  limit = 10,
  search,
  startDate,
  endDate,
}: GetDiscountParams) => {
  // ✅ Confirm store user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, `User not found: ${userId}`);

  const currentPage = Number(page) || 1;
  const perPage = Number(limit);
  const filters: any = { userId };

  // 🔍 Search filter (by name or type)
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { discountType: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // 🗓 Date range filter
  if (startDate && endDate) {
    filters.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const skip = (currentPage - 1) * perPage;

  const [discounts, total] = await Promise.all([
    Discount.find(filters).sort({ createdAt: -1 }).skip(skip).limit(perPage),
    Discount.countDocuments(filters),
  ]);

  return new ApiResponse(200, "Discounts retrieved successfully", {
    total,
    currentPage,
    totalPages: Math.ceil(total / perPage),
    discounts,
  });
};

export const createDiscountService = async (data: CreateDiscountRequest) => {
  try {
    // ✓ 1. Verify store owner exists
    const user = await User.findById(data.userId);
    if (!user) throw new ApiError(404, "Store owner not found");

    // ✓ 2. Prevent duplicate discount (same name + user)
    const existing = await Discount.findOne({
      userId: data.userId,
      discountName: data.discountName,
    });
    if (existing) {
      throw new ApiError(
        400,
        "A discount with this name already exists for this store"
      );
    }

    // ✓ 3. Validate dates
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, "Invalid date format for startDate or endDate");
    }

    if (end < start) {
      throw new ApiError(
        400,
        "Discount endDate cannot be earlier than startDate"
      );
    }

    // ✓ 4. Validate discountType rules
    if (data.discountType === "percentage") {
      if (data.discountValue <= 0) {
        throw new ApiError(400, "Percentage discount must be greater than 0%");
      }

      if (data.discountValue > 100) {
        throw new ApiError(
          400,
          "Percentage discount cannot be greater than 100%"
        );
      }
    }

    if (data.discountType === "fixed") {
      if (data.discountValue <= 0) {
        throw new ApiError(
          400,
          "Fixed amount discount must be greater than ₦0"
        );
      }
    }

    // ✓ 5. Create discount
    const newDiscount = await Discount.create(data);

    return new ApiResponse(
      201,
      "Discount created successfully",
      newDiscount.toJSON()
    );
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Create Discount Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while creating the discount"
    );
  }
};

export const updateDiscountService = async (
  id: string,
  data: UpdateDiscountRequest
) => {
  try {
    const discount = await Discount.findById(id);
    if (!discount) throw new ApiError(404, "Discount record not found");

    // Extract userId from existing record (not passed in update)
    const userId = discount.userId;

    // ✓ 2. Prevent duplicate name update
    if (data.discountName) {
      const existing = await Discount.findOne({
        userId,
        discountName: data.discountName,
        _id: { $ne: id }, // exclude current discount
      });

      if (existing) {
        throw new ApiError(
          400,
          "Another discount with this name already exists for this store"
        );
      }
    }

    // ✓ 3. Validate dates
    if (data.startDate || data.endDate) {
      const start = data.startDate
        ? new Date(data.startDate)
        : new Date(discount.startDate);

      const end = data.endDate
        ? new Date(data.endDate)
        : new Date(discount.endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ApiError(400, "Invalid date format for startDate or endDate");
      }

      if (end < start) {
        throw new ApiError(
          400,
          "Discount endDate cannot be earlier than startDate"
        );
      }
    }

    // ✓ 4. Validate discountType + value rules
    const discountType = data.discountType || discount.discountType;
    const discountValue =
      data.discountValue !== undefined
        ? data.discountValue
        : discount.discountValue;

    if (discountType === "percentage") {
      if (discountValue <= 0) {
        throw new ApiError(400, "Percentage discount must be greater than 0%");
      }

      if (discountValue > 100) {
        throw new ApiError(
          400,
          "Percentage discount cannot be greater than 100%"
        );
      }
    }

    if (discountType === "fixed") {
      if (discountValue <= 0) {
        throw new ApiError(
          400,
          "Fixed amount discount must be greater than ₦0"
        );
      }
    }

    // --- UPDATE ---

    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );

    return new ApiResponse(
      200,
      "Discount updated successfully",
      updatedDiscount
    );
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Update Discount Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while updating the discount"
    );
  }
};

export const deleteDiscountService = async (id: string) => {
  try {
    // ✅ Check if discount exists
    const discount = await Discount.findById(id);
    if (!discount) throw new ApiError(404, "Discount record not found");

    // ✅ Delete the discount
    await Discount.findByIdAndDelete(id);

    return new ApiResponse(200, "Discount deleted successfully", null);
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error("Delete Discount Error:", error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting the discount"
    );
  }
};

export const getDiscountStatsService = async (userId: string) => {
  // 1) Ensure user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const now = new Date();

  // 2) Aggregate discount stats safely
  const result = await Discount.aggregate([
    {
      $match: { userId: new Types.ObjectId(userId) },
    },
    {
      $addFields: {
        start: {
          $dateFromString: {
            dateString: "$startDate",
            onError: null,
            onNull: null,
          },
        },
        end: {
          $dateFromString: {
            dateString: "$endDate",
            onError: null,
            onNull: null,
          },
        },
      },
    },

    // Compute the 3 states correctly
    {
      $group: {
        _id: null,
        totalCoupons: { $sum: 1 },

        // ⭐ Active: start <= now AND end >= now
        activeCoupons: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$start", null] },
                  { $ne: ["$end", null] },
                  { $lte: ["$start", now] },
                  { $gte: ["$end", now] },
                ],
              },
              1,
              0,
            ],
          },
        },

        // ⭐ Scheduled: start > now
        scheduledCoupons: {
          $sum: {
            $cond: [
              {
                $and: [{ $ne: ["$start", null] }, { $gt: ["$start", now] }],
              },
              1,
              0,
            ],
          },
        },

        // ⭐ Expired: end < now
        expiredCoupons: {
          $sum: {
            $cond: [
              {
                $and: [{ $ne: ["$end", null] }, { $lt: ["$end", now] }],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  // 3) Return zeroed stats if empty
  const stats = result[0] || {
    totalCoupons: 0,
    activeCoupons: 0,
    scheduledCoupons: 0,
    expiredCoupons: 0,
  };

  return new ApiResponse(
    200,
    "Discount statistics retrieved successfully",
    stats
  );
};
