import { Request, Response, NextFunction } from "express";
import {
  createTaxService,
  deleteTaxService,
  getTaxesService,
  updateTaxService,
} from "../services/taxes.services";
import { UpdateTaxRequest } from "../interfaces/taxes.interface";
import { ExpresFunction } from "../interfaces/helper.interface";

export const getTaxes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await getTaxesService({ userId, ...req.query });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const createTax = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createTaxService(req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateTax: ExpresFunction<UpdateTaxRequest> = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await updateTaxService(id, req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteTax = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await deleteTaxService(id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};
