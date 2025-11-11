import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import User from "../models/User";
import {
  CreateTaxRequest,
  GetTaxesParams,
  UpdateTaxRequest,
} from "../interfaces/taxes.interface";
import Tax from "../models/taxes";

export const getTaxesService = async ({
  userId,
  page = 1,
  limit = 20,
  search,
  startDate,
  endDate,
}: GetTaxesParams) => {
  // ✅ Confirm store user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, `User not found: ${userId}`);

  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 20;
  const filters: any = { userId };

  // 🔍 Search filter (by name or location)
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
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

  const [taxes, total] = await Promise.all([
    Tax.find(filters).sort({ createdAt: -1 }).skip(skip).limit(perPage),
    Tax.countDocuments(filters),
  ]);

  return new ApiResponse(200, "Taxes retrieved successfully", {
    total,
    currentPage,
    totalPages: Math.ceil(total / perPage),
    taxes,
  });
};

export const createTaxService = async (data: CreateTaxRequest) => {
  try {
    // ✅ Verify store owner exists
    const user = await User.findById(data.userId);
    if (!user) throw new ApiError(404, "Store owner not found");

    // ✅ Prevent duplicate tax by name + user
    const existing = await Tax.findOne({
      userId: data.userId,
      name: data.name,
    });
    if (existing)
      throw new ApiError(
        400,
        "A tax with this name already exists for this store"
      );

    // ✅ Create new tax entry
    const newTax = await Tax.create(data);

    return new ApiResponse(201, "Tax created successfully", newTax.toJSON());
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error("Create Tax Error:", error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while creating the tax"
    );
  }
};

export const updateTaxService = async (id: string, data: UpdateTaxRequest) => {
  try {
    // ✅ Check if tax exists
    const tax = await Tax.findById(id);
    if (!tax) throw new ApiError(404, "Tax record not found");

    // ✅ Update only provided fields
    const updatedTax = await Tax.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );

    return new ApiResponse(200, "Tax updated successfully", updatedTax);
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error("Update Tax Error:", error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while updating the tax"
    );
  }
};

export const deleteTaxService = async (id: string) => {
  try {
    // ✅ Check if tax exists
    const tax = await Tax.findById(id);
    if (!tax) throw new ApiError(404, "Tax record not found");

    // ✅ Delete the tax
    await Tax.findByIdAndDelete(id);

    return new ApiResponse(200, "Tax deleted successfully", null);
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error("Delete Tax Error:", error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting the tax"
    );
  }
};
