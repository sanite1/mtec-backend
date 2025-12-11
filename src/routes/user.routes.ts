import {
  createUserValidation,
  deleteUserValidation,
  forgotPasswordValidation,
  getUserByIdValidation,
  loginUserValidation,
  refreshTokenValidation,
  resetPassswordValidation,
  sendEmailValidation,
  updatePassswordValidation,
  updateUserValidation,
  verifyUserValidation,
} from "./../validations/user.validation";
import { Router } from "express";
import {
  createUser,
  deleteUser,
  forgotPassword,
  getUserById,
  login,
  refresh,
  resetPassword,
  sendEmailToClient,
  updatePassword,
  updateUser,
  verifyUser,
} from "../controllers/user.controller";
import { upload } from "../config/upload";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
// import multer from "multer";

const router = Router();

router
  .route("/")
  .post(
    upload.fields([{ name: "profilePicture", maxCount: 1 }]),
    createUserValidation(),
    createUser
  );

router
  .route("/send-email")
  .post(upload.single("invoice"), sendEmailValidation(), sendEmailToClient);

router
  .route("/:id")
  .get(isAuthenticated, getUserByIdValidation(), getUserById)
  .delete(isAuthenticated, deleteUserValidation(), deleteUser)
  .patch(
    isAuthenticated,
    upload.fields([{ name: "profilePicture", maxCount: 1 }]),
    updateUserValidation(),
    updateUser
  );

router.post("/login", loginUserValidation(), login);

router.post("/refresh", refreshTokenValidation(), refresh);

router.post("/forgot-password", forgotPasswordValidation(), forgotPassword);

router.get("/verify/:id/:token", verifyUserValidation(), verifyUser);

router.patch(
  "/reset-password/:id/:token",
  resetPassswordValidation(),
  resetPassword
);

router.patch(
  "/update-password/:id",
  updatePassswordValidation(),
  updatePassword
);
export default router;
