import { NextFunction, Request, Response } from "express";
import { getStorefrontService } from "../services/storefront.service";

export const getStorefrontController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const storefront = await getStorefrontService(userId);

    return res.status(200).json(storefront);
  } catch (error) {
    next(error);
  }
};
