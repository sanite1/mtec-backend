import { Request, Response, NextFunction } from "express";
import {
  createShippingService,
  deleteShippingService,
  getShippingService,
  updateShippingService,
} from "../services/shipping.service";

export const getShipping = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const result = await getShippingService({
      userId,
      ...req.query,
    });

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const createShipping = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createShippingService(req.body);
    return res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const updateShipping = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await updateShippingService(id, req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteShipping = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await deleteShippingService(id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};
