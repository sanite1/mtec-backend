import { Request, Response, NextFunction } from "express";
import {
  createDiscountService,
  deleteDiscountService,
  getDiscountStatsService,
  getDiscountsService,
  updateDiscountService,
} from "../services/discount.services";
import { UpdateDiscountRequest } from "../interfaces/discount.interface";
import { ExpresFunction } from "../interfaces/helper.interface";

export const getDiscounts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await getDiscountsService({ userId, ...req.query });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const createDiscount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createDiscountService(req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateDiscount: ExpresFunction<UpdateDiscountRequest> = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await updateDiscountService(id, req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteDiscount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await deleteDiscountService(id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const getDiscountStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const result = await getDiscountStatsService(userId);

    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};
