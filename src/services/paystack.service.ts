// services/paystack.service.ts
import axios from "axios";
import Order from "../models/order";
import ApiError from "../errors/apiError";
import Payment from "../models/payment";
import ApiResponse from "../errors/apiResponse";

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
