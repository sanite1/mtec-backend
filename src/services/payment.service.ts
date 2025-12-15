import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import { Payment, Wallet } from "../models/payment";
import User from "../models/User";
import { Types } from "mongoose";

export const getPaymentStatsService = async (userId: string) => {
  // 1️⃣ Ensure user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // 2️⃣ Aggregate payment statistics
  const paymentStats = await Payment.aggregate([
    {
      $match: { userId: new Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },

        successfulPayments: {
          $sum: {
            $cond: [{ $eq: ["$status", "paid"] }, 1, 0],
          },
        },

        refundedPayments: {
          $sum: {
            $cond: [{ $eq: ["$status", "refunded"] }, 1, 0],
          },
        },

        failedPayments: {
          $sum: {
            $cond: [{ $eq: ["$status", "failed"] }, 1, 0],
          },
        },

        totalTransactionAmount: {
          $sum: {
            $cond: [
              { $eq: ["$status", "paid"] },
              { $ifNull: ["$amount", 0] },
              0,
            ],
          },
        },
      },
    },
  ]);

  const paymentResult = paymentStats[0] || {
    totalTransactions: 0,
    successfulPayments: 0,
    refundedPayments: 0,
    failedPayments: 0,
    totalTransactionAmount: 0,
  };

  // 3️⃣ Fetch wallet balances
  const wallet = await Wallet.findOne({ userId });

  const walletStats = {
    availableBalance: wallet?.availableBalance ?? 0,
    pendingBalance: wallet?.pendingBalance ?? 0,
    offlineTransactions: wallet?.offlineTransaction ?? 0,
    refund: wallet?.refund ?? 0,
  };

  // 4️⃣ Return response
  return new ApiResponse(200, "Payment statistics retrieved successfully", {
    totalTransactions: paymentResult.totalTransactions,
    successfulPayments: paymentResult.successfulPayments,
    refundedPayments: paymentResult.refundedPayments,
    failedPayments: paymentResult.failedPayments,
    totalTransactionAmount: paymentResult.totalTransactionAmount,
    ...walletStats,
  });
};

export const getPaymentsService = async ({
  userId,
  page = 1,
  limit = 10,
  search,
  startDate,
  endDate,
  status,
  channel,
}: {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: "paid" | "pending" | "refunded" | "failed";
  channel?: string; // card, bank, ussd, transfer, etc
}) => {
  // ✅ Confirm user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, `User not found: ${userId}`);

  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 20;

  const filters: any = { userId };

  /* ============================
     🔍 SEARCH
  ============================ */
  if (search) {
    filters.$or = [
      { reference: { $regex: search, $options: "i" } },
      { method: { $regex: search, $options: "i" } },
      { orderNumber: { $regex: search, $options: "i" } },
      { customerEmail: { $regex: search, $options: "i" } },
    ];
  }

  /* ============================
     📌 FILTERS
  ============================ */
  if (status) {
    filters.status = status;
  }

  if (channel) {
    filters.method = channel;
  }

  /* ============================
     🗓 DATE RANGE
  ============================ */
  if (startDate && endDate) {
    filters.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const skip = (currentPage - 1) * perPage;

  /* ============================
     📦 QUERY
  ============================ */
  const [payments, total] = await Promise.all([
    Payment.find(filters).sort({ createdAt: -1 }).skip(skip).limit(perPage),
    // .populate("orderId", "orderNumber total status"),
    Payment.countDocuments(filters),
  ]);

  return new ApiResponse(200, "Payments retrieved successfully", {
    total,
    currentPage,
    totalPages: Math.ceil(total / perPage),
    payments,
  });
};
