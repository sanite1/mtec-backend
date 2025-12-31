import { NextFunction, Request, Response } from "express";
import ApiError from "../errors/apiError";
import Order from "../models/order";
import {
  downloadInvoiceService,
  generateInvoicePdf,
} from "../services/invoice.service";

export const downloadInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;

    const result = await downloadInvoiceService(orderId);

    return res.status(200).send(result);
  } catch (error) {
    next(error);
  }
};
