import { ExpresFunction } from "../interfaces/helper.interface";
import { CreateCustomerRequest } from "../interfaces/customer.interface";
import {
  createCustomerService,
  deleteCustomerService,
  getCustomerByIdService,
  getCustomerOrdersService,
  getCustomerStatsService,
  getCustomersService,
  updateCustomerService,
  updateNewsletterService,
} from "../services/customer.service";
import ApiError from "../errors/apiError";
import { Request, Response, NextFunction } from "express";

export const createCustomer: ExpresFunction<CreateCustomerRequest> = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createCustomerService(req.body);
    return res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const result = await getCustomersService({
      userId,
      ...req.query,
    });

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await getCustomerByIdService(id);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await updateCustomerService(id, req.body);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, userId } = req.params;

    const response = await deleteCustomerService({
      customerId: id,
      userId,
    });

    return res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateNewsletter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { userId, newsletterSubscribed } = req.body;

    const response = await updateNewsletterService({
      customerId: id,
      userId,
      newsletterSubscribed,
    });

    return res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCustomerOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, userId } = req.params;
    const { page, limit, search, startDate, endDate } = req.query;

    const response = await getCustomerOrdersService({
      customerId: id,
      userId: userId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    return res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCustomerStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const response = await getCustomerStatsService(userId);

    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};
