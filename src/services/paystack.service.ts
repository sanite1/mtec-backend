// services/paystack.service.ts
import axios from "axios";
import Order from "../models/order";
import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import { Payment, Wallet } from "../models/payment";
import PayoutDetails from "../models/payoutDetails";
import { IPayoutDetails } from "../interfaces/payoutDetails.interface";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function initializePaystackPayment(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  if (order.channel !== "website") {
    throw new ApiError(400, "Payment not allowed for this channel");
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "Order already paid");
  }

  const reference = crypto.randomUUID();

  const payment = await Payment.create({
    orderId: order._id,
    userId: order.userId,
    reference,
    orderNumber: order.orderNumber,
    amount: order.total,
    customerEmail: order?.shippingAddress?.email,
  });

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email: payment.customerEmail,
      amount: payment.amount * 100, // Paystack expects kobo
      reference,
      callback_url: `${process.env.STORE_URL}/order-confirmation/${orderId}`,
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return new ApiResponse(200, "Order retrieved successfully", {
    authorizationUrl: response.data.data.authorization_url,
    reference,
  });
}

export async function createWithdrawal(userId: string) {
  const session = await Wallet.startSession();
  session.startTransaction();

  try {
    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) throw new ApiError(400, "Wallet does not exist");

    if (wallet.availableBalance <= 0) {
      throw new ApiError(400, "No available balance to withdraw");
    }

    const bank = await PayoutDetails.findOne({ userId });
    if (!bank) throw new ApiError(400, "Vendor bank details not found");

    // Ensure recipient exists
    if (!bank.recipientCode) {
      bank.recipientCode = await createPaystackRecipient(bank);
      await bank.save();
    }

    const amount = wallet.availableBalance;

    // 🔁 Move funds FIRST (atomic)
    wallet.availableBalance -= amount;
    wallet.pendingWithdrawalBalance += amount;
    await wallet.save({ session });

    // 🔹 Initiate Paystack transfer
    const response = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        amount: amount * 100,
        recipient: bank.recipientCode,
        reason: "Vendor withdrawal",
        metadata: {
          userId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    await session.commitTransaction();
    session.endSession();

    return response.data;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export const createPaystackRecipient = async (
  bank: IPayoutDetails
): Promise<string> => {
  try {
    const response = await axios.post(
      "https://api.paystack.co/transferrecipient",
      {
        type: "nuban",
        name: bank.accountName,
        account_number: bank.accountNumber,
        bank_code: bank.bankCode,
        currency: "NGN",
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return response.data.data.recipient_code;
  } catch (error) {
    // 🔥 Handle Paystack errors explicitly
    if (axios.isAxiosError(error)) {
      const paystackMessage =
        error.response?.data?.message || "Unable to resolve bank account";

      const paystackCode = error.response?.data?.code;

      // Known Paystack resolution failures
      if (
        paystackMessage.toLowerCase().includes("resolve") ||
        paystackCode === "invalid_bank_code"
      ) {
        throw new ApiError(
          400,
          "Bank account could not be resolved. Please check the account number and bank."
        );
      }

      // Other Paystack errors
      throw new ApiError(
        400,
        paystackMessage || "Failed to create payout recipient"
      );
    }

    throw error;
  }
};
