import { Request, Response, NextFunction } from "express";
import { ExpresFunction } from "../interfaces/helper.interface";
import {
  createStoreService,
  deleteStoreService,
  getStoreByIdService,
  resolveSlugService,
  updateStoreService,
} from "../services/store.service";
import { IStoreDetails } from "../interfaces/store.interface";
import { cloudinaryImageUpload } from "../services/cloudinary.service";

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

export const resolveSlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;

    const result = await resolveSlugService(slug);

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
    // Ensure req.files is correctly typed and logoUrl exists
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    if (files && files.logoUrl) {
      const logoUrl = files.logoUrl[0]; // Get the first uploaded file

      if (logoUrl) {
        const logoUrlResult = await cloudinaryImageUpload(
          logoUrl.buffer,
          "MTEC_Users"
        );
        req.body.logoUrl = logoUrlResult.secure_url;
      }
    }
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
