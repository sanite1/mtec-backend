// controllers/payment.controller.ts
import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { initializePaystackPayment } from "../services/paystack.service";
import Order from "../models/order";
import { Todo } from "../models/todo";
import { createOrderShippingTodo } from "../services/todo.service";
import { updateOrderPaymentService } from "../services/order.service";
import { Payment, Wallet } from "../models/payment";

export const initializePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const result = await initializePaystackPayment(orderId);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

// paystackWebhook
export async function paystackWebhook(req: Request, res: Response) {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const reference = event.data.reference;

    // 🔐 ATOMIC CLAIM
    const payment = await Payment.findOneAndUpdate(
      { reference, status: { $ne: "paid" } },
      {
        $set: {
          status: "paid",
          method: event.data.channel,
          paidAt: new Date(),
        },
      },
      { new: true }
    );

    // ❌ Already processed
    if (!payment) {
      return res.sendStatus(200);
    }

    // 💰 CREDIT ONCE
    await Wallet.updateOne(
      { userId: payment.userId },
      { $inc: { pendingBalance: payment.amount } },
      { upsert: true }
    );

    // 📦 Update order
    await updateOrderPaymentService(payment.orderId.toString(), "paid");
  }

  res.sendStatus(200);
}
