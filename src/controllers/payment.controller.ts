// controllers/payment.controller.ts
import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { initializePaystackPayment } from "../services/paystack.service";
import Order from "../models/order";
import { Todo } from "../models/todo";
import { createOrderShippingTodo } from "../services/todo.service";
import { updateOrderPaymentService } from "../services/order.service";
import { Payment, Wallet } from "../models/payment";
import { ExpresFunction } from "../interfaces/helper.interface";
import {
  getPaymentStatsService,
  getPaymentsService,
} from "../services/payment.service";

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

export const getPayments: ExpresFunction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, status, channel, search, startDate, endDate } =
      req.query;

    const { userId } = req.params;

    const data = await getPaymentsService({
      userId,
      page: Number(page),
      limit: Number(limit),
      channel: channel as string,
      status: status as "paid" | "pending" | "refunded" | "failed" | undefined,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getPaymentStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const result = await getPaymentStatsService(userId);

    res.status(result.statusCode).json(result);
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

export async function paystackTransferWebhook(req: Request, res: Response) {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;
  const data = event.data;

  /**
   * IMPORTANT:
   * You should store `transfer_code` or `reference`
   * when creating a withdrawal to prevent double-processing.
   */

  if (event.event === "transfer.success") {
    await Wallet.updateOne(
      { userId: data.metadata?.userId },
      {
        $inc: {
          withdrawnBalance: data.amount / 100,
          pendingWithdrawalBalance: -(data.amount / 100),
        },
      }
    );
  }

  if (
    event.event === "transfer.failed" ||
    event.event === "transfer.reversed"
  ) {
    await Wallet.updateOne(
      { userId: data.metadata?.userId },
      {
        $inc: {
          availableBalance: data.amount / 100,
          pendingWithdrawalBalance: -(data.amount / 100),
        },
      }
    );
  }

  return res.sendStatus(200);
}
