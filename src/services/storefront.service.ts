import ApiResponse from "../errors/apiResponse";
import Storefront from "../models/storefront";

export const getStorefrontService = async (userId: string) => {
  const storefront = await Storefront.findOne({ userId });

  if (!storefront) {
    // Create default settings if none exists
    const newStorefront = await Storefront.create({ userId });
    return new ApiResponse(
      200,
      "Storefront Settings Created successfully",
      storefront
    );
  }

  return new ApiResponse(
    200,
    "Storefront Settings Fetched successfully",
    storefront
  );
};
