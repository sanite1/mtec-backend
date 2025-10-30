import { ExpresFunction } from "../interfaces/helper.interface";
import { CreateCustomerRequest } from "../interfaces/customer.interface";
import {
  createCustomerService,
  deleteCustomerService,
  getCustomerByIdService,
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
    const { id } = req.params;
    const { userId } = req.body; // From auth middleware

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
