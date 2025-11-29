import { Types } from "mongoose";

export type OrderItemStatus = "pending" | "fulfilled" | "returned";

export interface OrderItem {
  productId: Types.ObjectId;
  variationId?: Types.ObjectId;
  name: string;
  sku?: string;
  price: number; // price used at purchase time
  quantity: number;
  subtotal: number;
  status?: OrderItemStatus;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
}

export type OrderStatus = "pending" | "completed" | "cancelled" | "refunded";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type PaymentMethod = "card" | "bank_transfer" | "cash" | "other";

// Request DTO for creating an order
export interface CreateOrderRequest {
  userId: string; // optional for guest
  customerId?: string; // optional for guest
  items: {
    productId: string;
    variationId?: string;
    // optional client-sent price/name/sku - server will look up authoritative values but will accept these as hints
    price?: number;
    name?: string;
    sku?: string;
    quantity: number;
  }[];
  // client can optionally provide shipping/calc but server will compute/verify
  shippingAddress: ShippingAddress;
  note?: string;
  // optional overrides - server will compute totals if not provided
  discount?: number;
  tax?: number;
  shippingFee?: number;
  paymentStatus?: PaymentStatus; // 'paid' => will decrement stock and log sale
  paymentMethod?: PaymentMethod;
  orderStatus?: OrderStatus;
}

export interface GetOrdersParams {
  userId: string;
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}
