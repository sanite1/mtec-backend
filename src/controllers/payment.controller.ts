// controllers/payment.controller.ts
import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { initializePaystackPayment } from "../services/paystack.service";
import Order from "../models/order";
import Payment from "../models/payment";
import { Todo } from "../models/todo";
import { createOrderShippingTodo } from "../services/todo.service";
import { updateOrderPaymentService } from "../services/order.service";

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

    const payment = await Payment.findOne({ reference });
    if (!payment) return res.sendStatus(200);

    payment.status = "pending";
    payment.method = event.data.channel;
    payment.paidAt = new Date();
    await payment.save();
    await updateOrderPaymentService(payment.orderId.toString(), "paid");
  }

  res.sendStatus(200);
}
