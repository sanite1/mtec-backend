import { Schema, model, Types } from "mongoose";
import {
  OrderItem,
  ShippingAddress,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  shippingStatus,
  IOrder,
} from "../interfaces/order.interface";

const orderItemSchema = new Schema<OrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variationId: { type: Schema.Types.ObjectId, ref: "ProductVariation" },
    name: { type: String, required: true },
    sku: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "fulfilled", "returned"],
      default: "pending",
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<ShippingAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, required: false },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customerId: {
      type: Schema.Types.ObjectId,
      //   ref: "Customer",
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "refunded"],
      default: "pending",
    },
    shippingStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "bank_transfer", "cash", "other"],
      default: "other",
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    channel: { type: String, required: true, default: 0 },
    discount: { type: Number, required: false, default: 0 },
    tax: { type: Number, required: false, default: 0 },
    shippingFee: { type: Number, required: false, default: 0 },
    total: { type: Number, required: true, default: 0 },
    shippingAddress: shippingAddressSchema,
    note: { type: String },
  },
  { timestamps: true }
);

export const Order = model<IOrder>("Order", orderSchema);
export default Order;
