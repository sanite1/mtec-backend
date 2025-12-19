import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import {
  CreateCustomerRequest,
  GetCustomerOrdersParams,
  GetCustomersParams,
  UpdateNewsletterParams,
} from "../interfaces/customer.interface";
import User from "../models/User";
import Customer from "../models/customer";
import Order from "../models/order";

export const createCustomerService = async (data: CreateCustomerRequest) => {
  try {
    // ✅ Check if store user exists
    const storeUser = await User.findById(data.userId);
    if (!storeUser) {
      throw new ApiError(404, "Store owner account not found");
    }

    // ✅ Prevent duplicate customers by email under same store
    const existingCustomer = await Customer.findOne({
      email: data.email,
      userId: data.userId,
    });

    if (existingCustomer) {
      throw new ApiError(
        400,
        "A customer with this email already exists in your store"
      );
    }

    // ✅ If sameAsShipping = true → copy shipping to billing
    if (data?.billing?.sameAsShipping === true) {
      data.billing = {
        sameAsShipping: data?.billing?.sameAsShipping,
        ...data.shipping,
      };
    }

    // ✅ Create customer
    const newCustomer = await Customer.create(data);

    return new ApiResponse(
      201,
      "Customer created successfully",
      newCustomer.toJSON()
    );
  } catch (error: any) {
    // ✅ Graceful error responses
    if (error instanceof ApiError) throw error;

    console.error("Create Customer Error:", error);

    // ⚠️ Return user-friendly message for Mongo duplicate email (unique index)
    if (error?.code === 11000 && error.keyPattern?.email) {
      throw new ApiError(400, "This email is already registered as a customer");
    }

    throw new ApiError(
      500,
      error.message || "Something went wrong while creating the customer"
    );
  }
};

export const getCustomersService = async ({
  userId,
  page = 1,
  limit = 20,
  search,
  subscribed,
  startDate,
  endDate,
}: GetCustomersParams) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, `User not found: ${userId}`);

  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 20;

  const filters: any = { userId };

  // 🔍 Search by name/email/phone
  if (search) {
    filters.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  // ✅ Newsletter filter
  if (subscribed === "true") filters.newsletterSubscribed = true;
  if (subscribed === "false") filters.newsletterSubscribed = false;

  // ✅ Date range
  if (startDate && endDate) {
    filters.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const skip = (currentPage - 1) * perPage;

  const [customers, total] = await Promise.all([
    Customer.find(filters).sort({ createdAt: -1 }).skip(skip).limit(perPage),

    Customer.countDocuments(filters),
  ]);

  return new ApiResponse(200, "Customers retrieved successfully", {
    total,
    currentPage,
    totalPages: Math.ceil(total / perPage),
    customers,
  });
};

export const getCustomerByIdService = async (id: string) => {
  const customer = await Customer.findById(id);

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  return new ApiResponse(
    200,
    "Customer fetched successfully",
    customer.toJSON()
  );
};

export const updateCustomerService = async (
  id: string,
  data: Partial<CreateCustomerRequest>
) => {
  try {
    const customer = await Customer.findById(id);
    if (!customer) throw new ApiError(404, "Customer not found");

    // ✅ Prevent duplicate email under same store
    if (data.email && data.email !== customer.email) {
      const existingCustomer = await Customer.findOne({
        email: data.email,
        userId: data.userId,
      });

      if (existingCustomer) {
        throw new ApiError(
          400,
          "A customer with this email already exists in your store"
        );
      }
    }

    // ✅ sameAsShipping logic
    if (data?.billing?.sameAsShipping === true) {
      data.billing = {
        sameAsShipping: true,
        ...data.shipping,
      };
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    return new ApiResponse(
      200,
      "Customer updated successfully",
      updatedCustomer?.toJSON()
    );
  } catch (err: any) {
    console.error("Update Customer Error:", err);

    if (err.code === 11000 && err.keyPattern?.email) {
      throw new ApiError(400, "This email is already registered as a customer");
    }

    throw new ApiError(
      err.statusCode || 500,
      err.message || "Failed to update customer"
    );
  }
};

export const deleteCustomerService = async ({
  customerId,
  userId,
}: {
  customerId: string;
  userId: string;
}) => {
  const customer = await Customer.findOne({
    _id: customerId,
    userId,
  });

  if (!customer) {
    throw new ApiError(404, `Customer not found or not authorized`);
  }

  await Customer.deleteOne({ _id: customerId });

  return new ApiResponse(200, "Customer deleted successfully");
};

export const updateNewsletterService = async ({
  customerId,
  userId,
  newsletterSubscribed,
}: UpdateNewsletterParams) => {
  const customer = await Customer.findOne({
    _id: customerId,
    userId,
  });

  if (!customer) {
    throw new ApiError(404, "Customer not found or unauthorized");
  }

  customer.newsletterSubscribed = newsletterSubscribed;
  await customer.save();

  return new ApiResponse(
    200,
    `Customer newsletter subscription updated`,
    customer
  );
};

export const getCustomerOrdersService = async ({
  customerId,
  userId,
  page = 1,
  limit = 20,
  search,
  startDate,
  endDate,
}: GetCustomerOrdersParams) => {
  const customer = await Customer.findOne({
    _id: customerId,
    userId,
  });

  if (!customer) {
    throw new ApiError(404, "Customer not found or unauthorized");
  }

  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 20;

  const filters: any = { customerId, userId };

  // 🔍 Search by orderNumber or shipping name
  if (search) {
    filters.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { "shippingAddress.fullName": { $regex: search, $options: "i" } },
    ];
  }

  if (startDate && endDate) {
    filters.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const skip = (currentPage - 1) * perPage;

  const [orders, total] = await Promise.all([
    Order.find(filters).sort({ createdAt: -1 }).skip(skip).limit(perPage),

    Order.countDocuments(filters),
  ]);

  return new ApiResponse(200, "Customer orders retrieved successfully", {
    total,
    currentPage,
    totalPages: Math.ceil(total / perPage),
    orders,
  });
};

export const getCustomerStatsService = async (userId: string) => {
  // ✅ Ensure store owner exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // 📊 Count customers
  const totalCustomers = await Customer.countDocuments({ userId });

  const newsletterSubscribers = await Customer.countDocuments({
    userId,
    newsletterSubscribed: true,
  });

  // 📅 New customers this month
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const newCustomersThisMonth = await Customer.countDocuments({
    userId,
    createdAt: { $gte: startOfMonth },
  });

  const recentCustomers = await Customer.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("firstName lastName email createdAt");

  // 📈 Newsletter subscription rate
  const subscriptionRate =
    totalCustomers > 0
      ? ((newsletterSubscribers / totalCustomers) * 100).toFixed(2)
      : "0.00";

  return new ApiResponse(200, "Customer stats fetched successfully", {
    totalCustomers,
    newsletterSubscribers,
    subscriptionRate,
    newCustomersThisMonth,
    recentCustomers,
  });
};
