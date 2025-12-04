import { Request, Response, NextFunction } from "express";
import {
  getDashboardSummaryService,
  getSalesOverviewDataService,
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
