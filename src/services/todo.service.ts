import { Types } from "mongoose";
import ApiError from "../errors/apiError";
import { Todo } from "../models/todo";
import { CreateTodoArgs, ITodo, TodoType } from "../interfaces/todo.interface";
import ApiResponse from "../errors/apiResponse";
import User from "../models/User";
import {
  sendLowStockMail,
  sendOrderNeedsShippingMail,
  sendOrderPendingPaymentBuyerMail,
  sendOrderPendingPaymentMerchantMail,
} from "./nodemailer/mail.service";
import Order from "../models/order";
import { IOrder } from "../interfaces/order.interface";
import { Store } from "../models/store.model";
import { IStoreDetails } from "../interfaces/store.interface";

// BASE GENERIC CREATE TODO SERVICE
export const createTodoService = async (args: CreateTodoArgs) => {
  const { userId, type, title, actionUrl } = args;

  try {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user ID");
    }

    if (!type || !title || !actionUrl) {
      throw new ApiError(400, "Missing required todo fields");
    }

    const todo = await Todo.create({
      userId,
      title: args.title,
      description: args.description || "",
      type: args.type,
      metadata: args.metadata || {},
      actionUrl: args.actionUrl,
      priority: args.priority || "medium",
    });

    return new ApiResponse(200, "Todo Creeated Successfully", todo);
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error("Create Tax Error:", error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while creating the tax"
    );
  }
};

// SPECIFIC TODO CREATORS
// Each service collects the arguments it needs

// 1. LOW STOCK PRODUCT
export const createLowStockTodo = async ({
  userId,
  productId,
  productName,
  currentStock,
}: {
  userId: string;
  productId: string;
  productName: string;
  currentStock: number;
}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(400, `User not found`);
    }
    await sendLowStockMail({
      email: user.email,
      name: user.firstname,
      productName: productName,
      quantity: currentStock,
      productId: productId,
    });
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error(" Error:", error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while sending mail"
    );
  }
  return createTodoService({
    userId,
    type: "low_stock",
    title: `Low Stock: ${productName}`,
    description: `${productName} is almost out of stock (${currentStock} left).`,
    metadata: { productId, currentStock },
    actionUrl: `/products/${productId}`,
    priority: "high",
  });
};

export const createOrderPendingPaymentTodo = async ({
  userId,
  orderId,
  orderName,
}: {
  userId: string;
  orderId: string;
  orderName: string;
}) => {
  try {
    const merchant = await User.findById(userId);
    if (!merchant) throw new ApiError(400, "Merchant not found");

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(400, "Order not found");

    const store = await Store.findById(merchant.storeId);
    if (!store) throw new ApiError(400, "Store not found");

    // Buyer email
    await sendOrderPendingPaymentBuyerMail({
      email: order?.shippingAddress?.email || "",
      data: mapOrderToEmailPayload(order, store),
    });
    console.log(merchant);

    // Merchant email
    await sendOrderPendingPaymentMerchantMail({
      email: merchant.email,
      data: mapOrderToEmailPayload(order, store),
    });
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.log(" Error:", error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while sending mail"
    );
  }

  return createTodoService({
    userId,
    type: "order_pending_payment",
    title: `${orderName} - Pending Payment`,
    description: `Order is awaiting payment confirmation.`,
    metadata: { orderId },
    actionUrl: `/orders/${orderId}`,
    priority: "medium",
  });
};

// 3. ORDER NEEDS SHIPPING
export const createOrderShippingTodo = async ({
  userId,
  orderId,
  orderName,
}: {
  userId: string;
  orderId: string;
  orderName: string;
}) => {
  try {
    const merchant = await User.findById(userId);
    if (!merchant) throw new ApiError(400, "Merchant not found");

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(400, "Order not found");

    const store = await Store.findById(merchant.storeId);
    if (!store) throw new ApiError(400, "Store not found");

    // Merchant email
    await sendOrderNeedsShippingMail({
      email: merchant.email,
      data: mapOrderToEmailPayload(order, store),
    });
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.log(" Error:", error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while sending mail"
    );
  }

  return createTodoService({
    userId,
    type: "order_needs_shipping",
    title: `Mark ${orderName} as shipped/delivered`,
    description: `Order ${orderName} is ready to be shipped.`,
    metadata: { orderId },
    actionUrl: `/orders/${orderId}`,
    priority: "high",
  });
};

// 4. STORE SETUP INCOMPLETE
export const createStoreSetupTodo = async ({
  userId,
  missingFields,
}: {
  userId: string;
  missingFields: string[];
}) => {
  return createTodoService({
    userId,
    type: "incomplete_store_setup",
    title: "Store Setup Incomplete",
    description: `You still need to complete: ${missingFields.join(", ")}`,
    metadata: { missingFields },
    actionUrl: "/settings/store",
    priority: "medium",
  });
};

// 5. MISSING BANK INFORMATION
export const createMissingBankInfoTodo = async ({
  userId,
}: {
  userId: string;
}) => {
  return createTodoService({
    userId,
    type: "missing_bank_info",
    title: "Bank Details Missing",
    description: "Add bank details to receive payments.",
    actionUrl: "/payments",
    priority: "high",
  });
};

// 6. NEW MESSAGE
export const createNewMessageTodo = async ({
  userId,
  conversationId,
}: {
  userId: string;
  conversationId: string;
}) => {
  return createTodoService({
    userId,
    type: "new_message",
    title: "New Customer Message",
    description: "You have an unread customer message.",
    metadata: { conversationId },
    actionUrl: `/inbox/${conversationId}`,
    priority: "low",
  });
};

// 7. CUSTOM TASK
export const createCustomTaskTodo = async ({
  userId,
  title,
  description,
  actionUrl,
  metadata,
}: {
  userId: string;
  title: string;
  description?: string;
  actionUrl: string;
  metadata?: Record<string, any>;
}) => {
  return createTodoService({
    userId,
    type: "custom_task",
    title,
    description,
    metadata,
    actionUrl,
  });
};

// GET TODOS
export const getTodosService = async ({ userId }: { userId: string }) => {
  // 1. Validate user
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, `User not found: ${userId}`);

  // 2. Build filters
  const filters: any = { userId };

  filters.completed = false;

  // 3. Parallel query
  const [todos] = await Promise.all([
    Todo.find(filters).sort({ createdAt: -1 }),
  ]);

  // 4. Response
  return new ApiResponse(200, "Todos retrieved successfully", todos);
};

// MARK TODO AS COMPLETED
export const completeTodoService = async (todoId: string) => {
  if (!Types.ObjectId.isValid(todoId)) {
    throw new ApiError(400, "Invalid todo ID");
  }

  const todo = await Todo.findById(todoId);
  if (!todo) {
    throw new ApiError(404, `Todo not found: ${todoId}`);
  }

  todo.completed = true;
  await todo.save();

  return new ApiResponse(200, "Todo marked as completed", todo);
};

// DELETE TODO
export async function deleteTodo({
  userId,
  type,
}: {
  userId: string;
  type: TodoType;
}) {
  try {
    // Validate ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user ID");
    }

    // Check if any matching todos exist
    const todos = await Todo.find({
      userId,
      type: type,
    });

    if (todos.length === 0) {
      return new ApiResponse(200, "No todos found", {
        deletedCount: 0,
      });
    }

    // Delete them
    const result = await Todo.deleteMany({
      userId,
      type: type,
    });

    return new ApiResponse(200, "Todos deleted successfully", {
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("Delete Todos Error:", error);

    if (error instanceof ApiError) throw error;

    throw new ApiError(
      500,
      error.message ||
        "Something went wrong while deleting incomplete store setup todos"
    );
  }
}

export const mapOrderToEmailPayload = (order: IOrder, store: IStoreDetails) => {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? store.storeLink
      : `http://localhost:3001/${store.slug}`;
  const baseUrl2 =
    process.env.NODE_ENV === "production"
      ? process.env.DOMAIN_NAME
      : `http://localhost:3000`;

  return {
    buyerName: order.shippingAddress.fullName,
    merchantName: store.businessName,
    storeColor: store.storeColor,
    storeLogo: store.logoUrl,
    storeEmail: store.businessEmail,
    storeLink: store.storeLink,
    orderNumber: order.orderNumber,
    orderDate: new Date(order.createdAt).toLocaleString(),
    paymentDate: new Date(order.createdAt).toLocaleString(),
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    shippingStatus: order.shippingStatus,
    paymentMethod: order.paymentMethod.replace("_", " "),
    shipping: {
      fullName: order.shippingAddress.fullName,
      phone: order.shippingAddress.phone,
      email: order.shippingAddress.email,
      address1: order.shippingAddress.addressLine1,
      address2: order.shippingAddress.addressLine2,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      country: order.shippingAddress.country,
    },
    items: order.items.map((item: any) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: `₦${item.price?.toLocaleString()}`,
      subtotal: `₦${item.subtotal?.toLocaleString()}`,
    })),
    totals: {
      subtotal: `₦${order.subtotal?.toLocaleString()}`,
      shipping: `₦${order.shippingFee?.toLocaleString()}`,
      tax: `₦${order.tax?.toLocaleString()}`,
      discount: `₦${order.discount?.toLocaleString()}`,
      total: `₦${order.total?.toLocaleString()}`,
    },
    orderUrl: `${baseUrl}/order-details/${order._id}`,
    adminOrderUrl: `${baseUrl2}/orders/${order._id}`,
  };
};
