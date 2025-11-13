import { Request, Response, NextFunction } from "express";
import {
  createLocationService,
  deleteLocationService,
  getLocationsService,
  updateLocationService,
} from "../services/location.services";
import { UpdateLocationRequest } from "../interfaces/location.interface";
import { ExpresFunction } from "../interfaces/helper.interface";

export const getLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await getLocationsService({ userId, ...req.query });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createLocationService(req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateLocation: ExpresFunction<UpdateLocationRequest> = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await updateLocationService(id, req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await deleteLocationService(id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};
