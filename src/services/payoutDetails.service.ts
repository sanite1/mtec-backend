import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import User from "../models/User";
import PayoutDetails from "../models/payoutDetails";
import { IPayoutDetails } from "../interfaces/payoutDetails.interface";
import { createPaystackRecipient } from "./paystack.service";

// ✅ Get payout details by userId
export const getPayoutDetailsService = async (userId: string) => {
  // Check user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, `User not found: ${userId}`);

  const payout = await PayoutDetails.findOne({ userId });

  if (!payout) {
    throw new ApiError(404, `Payout details not found for user: ${userId}`);
  }

  return new ApiResponse(200, "Payout details retrieved successfully", payout);
};

// ✅ Create payout details
export const createPayoutDetailsService = async (data: IPayoutDetails) => {
  try {
    // Validate user exists
    const user = await User.findById(data.userId);
    if (!user) throw new ApiError(404, `User not found: ${data.userId}`);

    // Prevent duplicate payout record per user
    const existing = await PayoutDetails.findOne({ userId: data.userId });

    if (existing) {
      throw new ApiError(400, "Payout details already exist for this user.");
    }
    data.recipientCode = await createPaystackRecipient(data);
    const payout = await PayoutDetails.create(data);

    return new ApiResponse(201, "Payout details created successfully", payout);
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Create Payout Details Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while creating payout details"
    );
  }
};

// ✅ Update payout details
export const updatePayoutDetailsService = async (
  id: string,
  data: Partial<IPayoutDetails>
) => {
  try {
    // Find existing payout record
    const payout = await PayoutDetails.findById(id);
    if (!payout) throw new ApiError(404, `Payout details not found: ${id}`);

    // userId must never be changed
    if (data.userId) {
      throw new ApiError(
        400,
        "You cannot modify the userId for payout details."
      );
    }
    console.log(data);

    const recipientCode = await createPaystackRecipient(data as IPayoutDetails);
    const updated = await PayoutDetails.findByIdAndUpdate(
      id,
      { ...data, recipientCode },
      {
        new: true,
        runValidators: true,
      }
    );

    return new ApiResponse(200, "Payout details updated successfully", updated);
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Update Payout Details Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while updating payout details"
    );
  }
};

// ✅ Delete payout details
export const deletePayoutDetailsService = async (id: string) => {
  try {
    const payout = await PayoutDetails.findById(id);

    if (!payout) {
      throw new ApiError(404, `Payout details not found: ${id}`);
    }

    await payout.deleteOne();

    return new ApiResponse(200, "Payout details deleted successfully");
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Delete Payout Details Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting payout details"
    );
  }
};
