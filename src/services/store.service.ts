import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import { IStoreCreate, IStoreUpdate } from "../interfaces/store.interface";
import User from "../models/User";
import { Store } from "../models/store.model";
import { createStoreSetupTodo, deleteTodo } from "./todo.service";

export const createStoreService = async (data: IStoreCreate) => {
  try {
    // 1) Ensure user exists
    const user = await User.findById(data.userId);
    if (!user) throw new ApiError(404, `User not found: ${data.userId}`);

    // 2) Prevent duplicate store
    const existingStore = await Store.findOne({ userId: data.userId });
    if (existingStore) {
      throw new ApiError(
        400,
        "A store profile already exists for this user. You can update it instead."
      );
    }

    // 3) Detect incomplete store data
    const REQUIRED_FIELDS: (keyof IStoreCreate)[] = [
      "storeName",
      "businessEmail",
      "businessPhone",
      "country",
      "logoUrl",
      "storeDescription",
    ];

    const missingFields = REQUIRED_FIELDS.filter((field) => !data[field]);
    const isIncomplete = missingFields.length > 0;

    // 4) Create new store
    const newStore = await Store.create(data);
    user.storeId = newStore._id;
    user.save();

    // 5) Automatically create TODO if incomplete
    if (isIncomplete) {
      await createStoreSetupTodo({
        userId: data.userId,
        missingFields,
      });
    }

    return new ApiResponse(
      201,
      "Store details created successfully",
      newStore.toJSON()
    );
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Create Store Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while creating store details"
    );
  }
};

export const updateStoreService = async (id: string, data: IStoreUpdate) => {
  try {
    const existingStore = await Store.findById(id);
    if (!existingStore) {
      throw new ApiError(404, `Store details not found: ${id}`);
    }

    // Prevent userId change
    if (data.userId) {
      throw new ApiError(400, "You cannot modify userId of a store profile.");
    }

    const REQUIRED_FIELDS: (keyof IStoreCreate)[] = [
      "storeName",
      "businessEmail",
      "businessPhone",
      "country",
      "logoUrl",
      "storeDescription",
    ];

    const finalState = { ...existingStore.toObject(), ...data };

    const missingFields = REQUIRED_FIELDS.filter((field) => !finalState[field]);
    const isIncomplete = missingFields.length > 0;

    // 5) Automatically create TODO if incomplete
    if (isIncomplete) {
      await createStoreSetupTodo({
        userId: data.userId,
        missingFields,
      });
    } else {
      // Delete any existing incomplete setup todo
      await deleteTodo({
        userId: existingStore.userId,
        type: "incomplete_store_setup",
      });
    }

    const updatedStore = await Store.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    return new ApiResponse(
      200,
      "Store details updated successfully",
      updatedStore?.toJSON()
    );
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Update Store Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while updating store details"
    );
  }
};

export const deleteStoreService = async (id: string) => {
  try {
    const store = await Store.findById(id);

    if (!store) {
      throw new ApiError(404, `Store details not found: ${id}`);
    }

    await store.deleteOne();

    return new ApiResponse(200, "Store details deleted successfully");
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Delete Store Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting store details"
    );
  }
};

export const getStoreByIdService = async (userId: string) => {
  try {
    const store = await Store.findOne({ userId });

    if (!store) throw new ApiError(404, `Store details not found: ${userId}`);

    return new ApiResponse(
      200,
      "Store details retrieved successfully",
      store.toJSON()
    );
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Get Store By ID Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while retrieving store details"
    );
  }
};

export const resolveSlugService = async (slug: string) => {
  try {
    const store = await Store.findOne({ slug });

    if (!store) throw new ApiError(404, `Store details not found: ${slug}`);

    return new ApiResponse(
      200,
      "Store details retrieved successfully",
      store.toJSON()
    );
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    console.error("Get Store By ID Error:", error);

    throw new ApiError(
      500,
      error.message || "Something went wrong while retrieving store details"
    );
  }
};
