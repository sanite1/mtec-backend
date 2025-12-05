import { Request, Response, NextFunction } from "express";
import {
  getDashboardSummaryService,
  getSalesOverviewDataService,
  getTopSellingProductsService,
} from "../services/dashboard.services";
import { SalesRangeFilter } from "../interfaces/dashboard.interface";

export const getDashboardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await getDashboardSummaryService(userId);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const getSalesOverviewData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { filter } = req.query;
    const result = await getSalesOverviewDataService({
      userId,
      filter: filter as SalesRangeFilter,
    });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTopSellingProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const result = await getTopSellingProductsService(userId);

    return res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};
