import { NextFunction, Request, Response } from "express";
import {
  getStorefrontService,
  updateStorefrontService,
} from "../services/storefront.service";
import { cloudinaryImageUpload } from "../services/cloudinary.service";

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

export const updateStorefront = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;
  try {
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    // Handle banner image
    if (files?.bannerImage?.[0]) {
      const upload = await cloudinaryImageUpload(
        files.bannerImage[0].buffer,
        "Storefront/banner"
      );
      req.body.banner = {
        ...JSON.parse(req.body.banner || "{}"),
        image: upload.secure_url,
      };
    }

    // Handle newsletter image
    if (files?.newsletterImg?.[0]) {
      const upload = await cloudinaryImageUpload(
        files.newsletterImg[0].buffer,
        "Storefront/newsletter"
      );
      req.body.newsletter = {
        ...JSON.parse(req.body.newsletter || "{}"),
        img: upload.secure_url,
      };
    }

    const response = await updateStorefrontService(userId, req.body);
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
