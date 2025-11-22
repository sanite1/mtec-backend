import { Request, Response, NextFunction } from "express";
import { ExpresFunction } from "../interfaces/helper.interface";
import {
  createStoreService,
  deleteStoreService,
  getStoreByIdService,
  updateStoreService,
} from "../services/store.service";
import { IStoreDetails } from "../interfaces/store.interface";

// ===============================
// GET STORE DETAILS BY ID
// ===============================
export const getStoreById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await getStoreByIdService(id);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

// ===============================
// CREATE STORE DETAILS
// ===============================
export const createStore = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createStoreService(req.body);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

// ===============================
// UPDATE STORE DETAILS
// ===============================
export const updateStore: ExpresFunction<IStoreDetails> = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await updateStoreService(id, req.body);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

// ===============================
// DELETE STORE DETAILS
// ===============================
export const deleteStore = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await deleteStoreService(id);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};
