import { Types } from "mongoose";
import ApiError from "../errors/apiError";
import User from "../models/User";
import Order from "../models/order";
import Customer from "../models/customer";
import { Product } from "../models/product";
import ApiResponse from "../errors/apiResponse";
import {
  SalesOverviewResponse,
  SalesRangeFilter,
} from "../interfaces/dashboard.interface";

export const getDashboardSummaryService = async (userId: string) => {
  // 1) Ensure user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const userObjectId = new Types.ObjectId(userId);

  // 2) Aggregate TOTAL ORDERS + TOTAL REVENUE
  const orderStats = await Order.aggregate([
    {
      $match: { userId: userObjectId },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$paymentStatus", "paid"] },
              { $ifNull: ["$total", 0] },
              0,
            ],
          },
        },
      },
    },
  ]);

  const orderData = orderStats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
  };

  // 3) Aggregate TOTAL CUSTOMERS
  const customerCount = await Customer.countDocuments({
    userId: userObjectId,
  });

  // 4) Aggregate TOTAL INVENTORY VALUE
  const inventoryStats = await Product.aggregate([
    {
      $match: { userId: userObjectId },
    },
    {
      $group: {
        _id: null,
        totalInventoryValue: {
          $sum: {
            $multiply: [
              { $ifNull: ["$price", 0] },
              { $ifNull: ["$totalStock", 0] },
            ],
          },
        },
      },
    },
  ]);

  const inventoryData = inventoryStats[0] || {
    totalInventoryValue: 0,
  };

  // 5) Return structured summary
  return new ApiResponse(200, "Dashboard summary retrieved successfully", {
    totalOrders: orderData.totalOrders,
    totalCustomers: customerCount,
    totalRevenue: orderData.totalRevenue,
    totalInventoryValue: inventoryData.totalInventoryValue,
  });
};

const getDateRangeFromFilter = (filter: SalesRangeFilter) => {
  const now = new Date();
  let startDate: Date;

  switch (filter) {
    case "this_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;

    case "3_months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;

    case "6_months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;

    case "1_year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;

    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate, endDate: now };
};

export const getSalesOverviewDataService = async ({
  userId,
  filter,
}: {
  userId: string;
  filter: SalesRangeFilter;
}) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const { startDate, endDate } = getDateRangeFromFilter(filter);

  // Fetch all orders in range
  const orders = await Order.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate },
        status: "completed",
      },
    },
  ]);

  // ------- BUILD STRUCTURE BASED ON FILTER ---------
  let labels: string[] = [];
  let data: number[] = [];

  if (filter === "this_month") {
    // ================== 📅 DAILY DATA ==================
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Initialize all days to 0 revenue
    const dailyRevenue: Record<number, number> = {};
    for (let day = 1; day <= daysInMonth; day++) dailyRevenue[day] = 0;

    // Add revenues
    orders.forEach((order) => {
      const day = new Date(order.createdAt).getDate();
      dailyRevenue[day] += order.total;
    });

    labels = Object.keys(dailyRevenue); // "1", "2", "3", ...
    data = Object.values(dailyRevenue); // revenue per day
  } else {
    // =============== 📅 MONTHLY DATA ==================
    const monthDiff =
      filter === "3_months" ? 3 : filter === "6_months" ? 6 : 12; // 1 year

    const monthlyRevenue: Record<string, number> = {};

    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - (monthDiff - 1),
      1
    );

    // Build month keys like "2025-01"
    const generateMonthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    // Initialize months
    const iter = new Date(start);
    while (iter <= now) {
      monthlyRevenue[generateMonthKey(iter)] = 0;
      iter.setMonth(iter.getMonth() + 1);
    }

    // Add order revenue to proper month
    orders.forEach((order) => {
      const dt = new Date(order.createdAt);
      const key = generateMonthKey(dt);
      if (monthlyRevenue[key] !== undefined) {
        monthlyRevenue[key] += order.total;
      }
    });

    labels = Object.keys(monthlyRevenue).map((key) =>
      new Date(key + "-01").toLocaleString("default", { month: "short" })
    );

    data = Object.values(monthlyRevenue);
  }

  const totalRevenue = data.reduce((a, b) => a + b, 0);

  return new ApiResponse(200, "Sales overview retrieved", {
    labels,
    data,
    totalRevenue,
  });
};

export const getTopSellingProductsService = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const topProducts = await Order.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: "completed",
      },
    },

    // Expand order items
    { $unwind: "$items" },

    // Group by product
    {
      $group: {
        _id: "$items.productId",
        totalSold: { $sum: "$items.quantity" },
        // Capture the latest price in case orders stored old data
        lastOrderPrice: { $last: "$items.price" },
      },
    },

    // Get product details
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },

    // Project final output
    {
      $project: {
        productId: "$product._id",
        name: "$product.name",
        image: { $first: "$product.images" }, // return first image
        price: {
          // Prefer product price, fallback to order price
          $ifNull: ["$product.price", "$lastOrderPrice"],
        },
        totalSold: 1,
      },
    },

    // Sort by sales
    { $sort: { totalSold: -1 } },
    { $limit: 3 },
  ]);

  return new ApiResponse(200, "Top selling products retrieved", topProducts);
};
