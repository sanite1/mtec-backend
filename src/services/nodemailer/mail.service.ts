import { createTransport } from "nodemailer";
import ApiError from "../../errors/apiError";
import { IUser } from "../../interfaces/user.interface";
import transporter from "./nodemailer";
import path from "path";
import fs from "fs";

const DOMAIN_NAME = process.env.DOMAIN_NAME;
export const sendVerificationMail = async (userInfo: IUser) => {
  const mailOptions = {
    from: `"MTEC" <${process.env.AUTH_EMAIL}>`,
    to: userInfo.email,
    template: "./verifyemail",
    subject: "Verify your email",
    context: {
      name: userInfo.lastname,
      email: userInfo.email,
      url: `${DOMAIN_NAME}/verify/${userInfo._id}/${userInfo.verificationToken}`,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error sending verification email ${error}`);
  }
};

export const sendforgotPasswordMail = async (userInfo: IUser) => {
  const mailOptions = {
    from: `"MTEC" <${process.env.AUTH_EMAIL}>`,
    to: userInfo.email,
    subject: "Reset your password",
    template: "./passwordreset",
    context: {
      name: userInfo.lastname,
      url: `${DOMAIN_NAME}/reset-password/${userInfo._id}/${userInfo.resetToken}`,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error Sending forgot Password Mail ${error}`);
  }
};

export const sendInvoiceMail = async (
  file: { path: string; filename: string },
  email: string,
  user: string
) => {
  const filePath = file.path;
  const mailOptions = {
    from: user,
    to: email,
    subject: "Invoice",
    text: "Please find the attached PDF.",
    attachments: [
      {
        filename: file.filename,
        href: filePath,
        contentType: "application/pdf",
      },
    ],
  };

  try {
    const emailTransporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });
    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, "Error Sending email");
  }
};
