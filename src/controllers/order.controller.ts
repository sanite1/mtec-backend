import { Request, Response, NextFunction } from "express";
import {
  cancelOrderService,
  createOrderService,
  getOrderByIdService,
  getOrderStatsService,
  getOrdersService,
  requestPaymentService,
  updateOrderPaymentService,
  updateOrderShippingService,
  updateOrderStatusService,
} from "../services/order.service";
import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import { ExpresFunction } from "../interfaces/helper.interface";
import { CreateOrderRequest } from "../interfaces/order.interface";

export const createOrder: ExpresFunction<CreateOrderRequest> = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: CreateOrderRequest = req.body;
    // if authenticated user exists, prefer that id
    if ((req as any).user?.id) {
      payload.customerId = payload.customerId || (req as any).user.id;
    }

    const result = await createOrderService(payload);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const getOrders: ExpresFunction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page,
      limit,
      status,
      paymentStatus,
      paymentMethod,
      search,
      startDate,
      endDate,
    } = req.query;

    const { userId } = req.params;

    const data = await getOrdersService({
      userId,
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      paymentStatus: paymentStatus as string,
      paymentMethod: paymentMethod as string,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getOrderByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await getOrderByIdService(id);

    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const getOrderStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const result = await getOrderStatsService(userId);

    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const cancelOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await cancelOrderService(id);
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await updateOrderStatusService(id, status);
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateOrderPaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const result = await updateOrderPaymentService(id, paymentStatus);
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateOrderShippingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { shippingStatus } = req.body;

    const result = await updateOrderShippingService(id, shippingStatus);
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const requestPaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await requestPaymentService(id);
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};
