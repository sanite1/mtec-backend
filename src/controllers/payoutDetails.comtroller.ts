import { Request, Response, NextFunction } from "express";
import {
  createPayoutDetailsService,
  updatePayoutDetailsService,
  deletePayoutDetailsService,
  getPayoutDetailsService,
} from "../services/payoutDetails.service";
import { ExpresFunction } from "../interfaces/helper.interface";
import { UpdatePayoutDetailsRequest } from "../interfaces/payoutDetails.interface";
import axios from "axios";

/**
 * @desc Get payout details for a user
 * @route GET /api/payout-details/:userId
 */
export const getPayoutDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await getPayoutDetailsService(userId);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create payout details
 * @route POST /api/payout-details
 */
export const createPayoutDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createPayoutDetailsService(req.body);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update payout details
 * @route PUT /api/payout-details/:id
 */
export const updatePayoutDetails: ExpresFunction<
  UpdatePayoutDetailsRequest
> = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await updatePayoutDetailsService(id, req.body);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete payout details
 * @route DELETE /api/payout-details/:id
 */
export const deletePayoutDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await deletePayoutDetailsService(id);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function getPaystackBanks(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const response = await axios.get(
      "https://api.paystack.co/bank?currency=NGN",
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    res.status(200).json({
      status: true,
      data: response.data.data,
    });
  } catch (error) {
    next(error);
  }
}
