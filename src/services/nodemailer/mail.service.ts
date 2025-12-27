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
      currentYear: new Date().getFullYear(),
    },
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error Sending forgot Password Mail ${error}`);
  }
};

export const sendLowStockMail = async ({
  email,
  name,
  productName,
  quantity,
  productId,
}: {
  email: string;
  name: string;
  productName: string;
  quantity: number;
  productId: string;
}) => {
  const mailOptions = {
    from: `"MTEC" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: `Low Stock Alert: ${productName}`,
    template: "./lowstock",
    context: {
      name,
      productName,
      quantity,
      url: `${DOMAIN_NAME}/products/${productId}`,
      currentYear: new Date().getFullYear(),
    },
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error sending low stock email: ${error}`);
  }
};

export const sendOrderPendingPaymentBuyerMail = async ({
  email,
  data,
}: {
  email: string;
  data: any;
}) => {
  const mailOptions = {
    from: `"${data.merchantName}" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: "Order Pending Payment Confirmation",
    template: "./order-pending-payment-buyer",
    context: { ...data, currentYear: new Date().getFullYear() },
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(
      500,
      `Error sending order pending payment email: ${error}`
    );
  }
};

export const sendOrderPendingPaymentMerchantMail = async ({
  email,
  data,
}: {
  email: string;
  data: any;
}) => {
  const mailOptions = {
    from: `"MTEC" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: "New Order Awaiting Payment",
    template: "./order-pending-payment-merchant",
    context: { ...data, currentYear: new Date().getFullYear() },
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(
      500,
      `Error sending order pending payment email: ${error}`
    );
  }
};

export const sendPaymentConfirmedMail = async ({
  email,
  data,
}: {
  email: string;
  data: any;
}) => {
  const mailOptions = {
    from: `"${data.merchantName}" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: `${data.orderNumber} - Payment Confirmed`,
    template: "./payment-confirmed",
    context: { ...data, currentYear: new Date().getFullYear() },
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error sending payment confirmed email: ${error}`);
  }
};

export const sendPaymentConfirmedMerchantMail = async ({
  email,
  data,
}: {
  email: string;
  data: any;
}) => {
  const mailOptions = {
    from: `"MTEC" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: `${data.orderNumber} - Payment Confirmed`,
    template: "./payment-confirmed-merchant",
    context: { ...data, currentYear: new Date().getFullYear() },
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(
      500,
      `Error sending payment confirmed email to merchant: ${error}`
    );
  }
};

export const sendOrderNeedsShippingMail = async ({
  email,
  data,
}: {
  email: string;
  data: any;
}) => {
  const mailOptions = {
    from: `"MTEC" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: `${data.orderNumber} - Shipping Needed`,
    template: "./order-needs-shipping",
    context: { ...data, currentYear: new Date().getFullYear() },
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(
      500,
      `Error sending order needs shipping to merchant: ${error}`
    );
  }
};

export const sendOrderShippingStatusMail = async ({
  email,
  data,
}: {
  email: string;
  data: any;
}) => {
  const mailOptions = {
    from: `"${data.merchantName}" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: `${data.orderNumber} - Shipping Status Updated`,
    template: "./shipping-updated",
    context: { ...data, currentYear: new Date().getFullYear() },
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error sending shipping status: ${error}`);
  }
};

export const sendOrderCanceledMail = async ({
  email,
  data,
}: {
  email: string;
  data: any;
}) => {
  const mailOptions = {
    from: `"${data.merchantName}" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: `${data.orderNumber} - Order Cancelled`,
    template: "./order-canceled",
    context: { ...data, currentYear: new Date().getFullYear() },
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error sending order canceled: ${error}`);
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
