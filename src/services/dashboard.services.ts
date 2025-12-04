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
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 3);
      break;

    case "6_months":
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 6);
      break;

    case "1_year":
      startDate = new Date();
      startDate.setFullYear(now.getFullYear() - 1);
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

  const sales = await Order.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate },
        status: "completed", // adjust if needed
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalRevenue: { $sum: "$total" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // ✅ Convert to graph-friendly format
  const labels: string[] = [];
  const data: number[] = [];
  let totalRevenue = 0;

  sales.forEach((item) => {
    const monthLabel = new Date(
      item._id.year,
      item._id.month - 1
    ).toLocaleString("default", { month: "short" });

    labels.push(monthLabel);
    data.push(item.totalRevenue);
    totalRevenue += item.totalRevenue;
  });

  return new ApiResponse(200, "Sales overview retrieved", {
    labels,
    data,
    totalRevenue,
  });
};
