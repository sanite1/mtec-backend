// services/invoice.service.ts
import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import Order from "../models/order";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";
import { UploadApiResponse } from "cloudinary";
import { cloudinaryImageUpload } from "./cloudinary.service";
import { IOrder } from "../interfaces/order.interface";
import { IStoreDetails } from "../interfaces/store.interface";
import { Store } from "../models/store.model";

export const downloadInvoiceService = async (orderId: string) => {
  const order = await Order.findById(orderId).lean();
  if (!order) throw new ApiError(404, "Order not found");

  const isPaid = order.paymentStatus === "paid";
  const paymentUrl = !isPaid ? buildPaymentLink(order._id.toString()) : null;

  const pdfBuffer = await generateInvoicePdf({ order, isPaid, paymentUrl });

  // Upload PDF to Cloudinary
  const result: UploadApiResponse = await cloudinaryImageUpload(
    pdfBuffer,
    "invoices", // folder name
    "raw" // resource_type for PDFs
  );

  // Cloudinary URL
  const invoiceUrl = result.secure_url;
  console.log(invoiceUrl);

  return new ApiResponse(200, "Invoice generated successfully", { invoiceUrl });
};

export const buildPaymentLink = (orderId: string) => {
  return `${process.env.STORE_URL}/checkout/${orderId}`;
};

export const renderTemplate = (templateName: string, data: any) => {
  const filePath = path.join(
    __dirname,
    `../services/nodemailer/templates/${templateName}.handlebars`
  );

  const html = fs.readFileSync(filePath, "utf-8");
  const compiled = Handlebars.compile(html);

  return compiled(data);
};

interface GenerateInvoiceParams {
  order: any;
  isPaid: boolean;
  paymentUrl?: string | null;
}

export const generateInvoicePdf = async ({
  order,
  isPaid,
  paymentUrl,
}: GenerateInvoiceParams): Promise<Buffer> => {
  const store = await Store.findOne({ userId: order.userId });
  if (!store) throw new ApiError(404, "Store not found");

  const html = renderTemplate(
    "invoice",
    mapOrderToEmailPayload(order, store, isPaid, paymentUrl as string)
  );

  const browser = await puppeteer.launch({
    headless: "shell",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "10mm",
      bottom: "10mm", // space for footer
    },
  });

  await browser.close();
  return Buffer.from(pdf);
};

export const mapOrderToEmailPayload = (
  order: IOrder,
  store: IStoreDetails,
  isPaid: boolean,
  paymentUrl: string
) => {
  return {
    merchantName: store.businessName,
    storeLogo: store.logoUrl,
    storeColor: store.storeColor,
    storeEmail: store.businessEmail,

    orderNumber: order.orderNumber,
    orderDate: new Date(order.createdAt).toLocaleDateString(),

    isPaid: isPaid,
    paymentMethod: order.paymentMethod.replace("_", " "),

    shipping: {
      fullName: order.shippingAddress.fullName,
      phone: order.shippingAddress.phone,
      email: order.shippingAddress.email,
      address1: order.shippingAddress.addressLine1,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
    },

    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: `₦${item.price.toLocaleString()}`,
      subtotal: `₦${item.subtotal.toLocaleString()}`,
    })),

    totals: {
      subtotal: `₦${order.subtotal.toLocaleString()}`,
      //   tax: `₦${order?.tax ? order?.tax.toLocaleString() : 0}`,
      //   shipping: `₦${order.shippingFee?.toLocaleString()}`,
      shipping: order.shippingFee
        ? `₦${order.shippingFee.toLocaleString()}`
        : null,
      tax: order.tax ? `₦${order.tax.toLocaleString()}` : null,
      discount: order.discount ? `₦${order.discount.toLocaleString()}` : null,
      total: `₦${order.total.toLocaleString()}`,
    },

    paymentUrl: paymentUrl,
  };
};
