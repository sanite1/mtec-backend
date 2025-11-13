import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import User from "../models/User";
import {
  CreateLocationRequest,
  GetLocationParams,
  UpdateLocationRequest,
} from "../interfaces/location.interface";
import Location from "../models/location";

export const getLocationsService = async ({
  userId,
  page = 1,
  limit = 20,
  search,
  startDate,
  endDate,
}: GetLocationParams) => {
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

  const [locations, total] = await Promise.all([
    Location.find(filters).sort({ createdAt: -1 }).skip(skip).limit(perPage),
    Location.countDocuments(filters),
  ]);

  return new ApiResponse(200, "Locations retrieved successfully", {
    total,
    currentPage,
    totalPages: Math.ceil(total / perPage),
    locations,
  });
};

export const createLocationService = async (data: CreateLocationRequest) => {
  try {
    // ✅ Verify store owner exists
    const user = await User.findById(data.userId);
    if (!user) throw new ApiError(404, "Store owner not found");

    // ✅ Prevent duplicate location by name + user
    const existing = await Location.findOne({
      userId: data.userId,
      name: data.name,
    });
    if (existing)
      throw new ApiError(
        400,
        "A location with this name already exists for this store"
      );

    // ✅ Create new location entry
    const newLocation = await Location.create(data);

    return new ApiResponse(
      201,
      "Location created successfully",
      newLocation.toJSON()
    );
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error("Create Location Error:", error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while creating the location"
    );
  }
};

export const updateLocationService = async (
  id: string,
  data: UpdateLocationRequest
) => {
  try {
    // ✅ Check if location exists
    const location = await Location.findById(id);
    if (!location) throw new ApiError(404, "Location record not found");

    // ✅ Update only provided fields
    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );

    return new ApiResponse(
      200,
      "Location updated successfully",
      updatedLocation
    );
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error("Update Location Error:", error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while updating the location"
    );
  }
};

export const deleteLocationService = async (id: string) => {
  try {
    // ✅ Check if location exists
    const location = await Location.findById(id);
    if (!location) throw new ApiError(404, "Location record not found");

    // ✅ Delete the location
    await Location.findByIdAndDelete(id);

    return new ApiResponse(200, "Location deleted successfully", null);
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error("Delete Location Error:", error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting the location"
    );
  }
};
