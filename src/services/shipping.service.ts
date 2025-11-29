import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import User from "../models/User";
import { GetShippingParams, IShipping } from "../interfaces/shipping.interface";
import Shipping from "../models/shipping";

export const getShippingService = async ({
  userId,
  page = 1,
  limit = 10,
  search,
  location,
  isActive,
}: GetShippingParams) => {
  // ✅ Check if user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, `User not found: ${userId}`);

  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 10;
  const skip = (currentPage - 1) * perPage;

  const filters: any = { userId };

  if (search) {
    filters.name = { $regex: search, $options: "i" };
  }

  if (location) {
    filters.locationName = { $regex: location, $options: "i" };
  }

  if (isActive === "true") filters.isActive = true;
  if (isActive === "false") filters.isActive = false;

  const [shippingMethods, total] = await Promise.all([
    Shipping.find(filters).sort({ createdAt: -1 }).skip(skip).limit(perPage),

    Shipping.countDocuments(filters),
  ]);

  return new ApiResponse(200, "Shipping methods retrieved successfully", {
    total,
    currentPage,
    totalPages: Math.ceil(total / perPage),
    shipping: shippingMethods,
  });
};

export const createShippingService = async (data: IShipping) => {
  try {
    // ✅ Check if user exists
    const user = await User.findById(data.userId);
    if (!user) throw new ApiError(404, `User not found: ${data.userId}`);

    // ✅ Prevent duplicate shipping method by name per user
    const existing = await Shipping.findOne({
      userId: data.userId,
      name: data.name,
    });

    if (existing) {
      throw new ApiError(
        400,
        "A shipping method with this name already exists."
      );
    }

    // ✅ Create shipping method
    const newShipping = await Shipping.create(data);

    return new ApiResponse(
      201,
      "Shipping method created successfully",
      newShipping.toJSON()
    );
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Create Shipping Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while creating shipping method"
    );
  }
};

export const updateShippingService = async (
  id: string,
  data: Partial<IShipping>
) => {
  try {
    // ✅ Find existing shipping record
    const existingShipping = await Shipping.findById(id);
    if (!existingShipping)
      throw new ApiError(404, `Shipping method not found: ${id}`);

    // ✅ Prevent name conflict under same user
    if (data.name) {
      const duplicate = await Shipping.findOne({
        userId: data.userId,
        name: data.name,
        _id: { $ne: id },
      });

      if (duplicate) {
        throw new ApiError(
          400,
          "A shipping method with this name already exists for this user."
        );
      }
    }

    // ✅ Update record
    const updated = await Shipping.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    return new ApiResponse(
      200,
      "Shipping method updated successfully",
      updated?.toJSON()
    );
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Update Shipping Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while updating shipping method"
    );
  }
};

export const deleteShippingService = async (id: string) => {
  try {
    const shipping = await Shipping.findById(id);

    if (!shipping) {
      throw new ApiError(404, `Shipping method not found: ${id}`);
    }

    await shipping.deleteOne();

    return new ApiResponse(200, "Shipping method deleted successfully");
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Delete Shipping Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting shipping method"
    );
  }
};
