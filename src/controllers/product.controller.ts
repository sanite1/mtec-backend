import { Request, Response, NextFunction } from "express";
import {
  adjustProductQuantityService,
  createProductService,
  deleteProductService,
  getProductHistoryService,
  getProductsByUserService,
  getSingleProductService,
  resetProductHistoryService,
  updateProductService,
  updateProductVariationService,
} from "../services/product.service";
import ApiError from "../errors/apiError";
import { cloudinaryImageUpload } from "../services/cloudinary.service";
import { ExpresFunction } from "../interfaces/helper.interface";
import { ProductFilterParams } from "../interfaces/product.interface";
import ApiResponse from "../errors/apiResponse";

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Handle uploaded images
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    if (files && files.images) {
      const uploadResults = await Promise.all(
        files.images.map((file) =>
          cloudinaryImageUpload(file.buffer, "Products")
        )
      );
      req.body.images = uploadResults.map((r) => r.secure_url);
    }

    const response = await createProductService(req.body);
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getProductsByUser: ExpresFunction<ProductFilterParams> = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { category, name, isActive, page, limit, location } = req.query;

    const filters: ProductFilterParams = {
      userId,
      category: category as string,
      name: name as string,
      location: location as string,
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    };

    const result = await getProductsByUserService(filters);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getSingleProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, productId } = req.params;

    const productData = await getSingleProductService(userId, productId);

    res.status(200).json(productData);
  } catch (error: any) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;

    // Handle uploaded images if any
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    if (files && files.images) {
      const uploadResults = await Promise.all(
        files.images.map((file) =>
          cloudinaryImageUpload(file.buffer, "Products")
        )
      );
      req.body.images = uploadResults.map((r) => r.secure_url);
    }

    const updated = await updateProductService(productId, req.body);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const response = await deleteProductService(id);
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const adjustProductQuantity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const response = await adjustProductQuantityService(id, req.body);
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateProductVariation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, varId } = req.params;
    const updateData = req.body;

    const result = await updateProductVariationService(
      productId,
      varId,
      updateData
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getProductHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await getProductHistoryService(
      productId,
      Number(page),
      Number(limit)
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetProductHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await resetProductHistoryService(id);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
