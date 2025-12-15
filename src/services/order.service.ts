import mongoose, { Types } from "mongoose";
import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import {
  CreateOrderRequest,
  GetOrdersParams,
  shippingStatus,
} from "../interfaces/order.interface";
import { Product, ProductHistory, ProductVariation } from "../models/product";
import Order from "../models/order";
import User from "../models/User";
import {
  createLowStockTodo,
  createOrderPendingPaymentTodo,
  createOrderShippingTodo,
} from "./todo.service";
import { Todo } from "../models/todo";
import { Payment, Wallet } from "../models/payment";

export const createOrderService = async (data: CreateOrderRequest) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const user = await User.findById(data.userId).session(session);
  if (!user) throw new ApiError(404, `User not found: ${data.userId}`);
  try {
    // 1️⃣ Validate items
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new ApiError(400, "Order must contain at least one item");
    }

    const itemsProcessed: any[] = [];
    let subtotal = 0;

    for (const item of data.items) {
      const { productId, variationId, quantity } = item;

      const product = await Product.findById(productId).session(session);
      if (!product) throw new ApiError(404, `Product not found: ${productId}`);

      let variation: any = null;
      if (variationId) {
        variation =
          await ProductVariation.findById(variationId).session(session);
        if (!variation)
          throw new ApiError(
            404,
            `Product variation not found: ${variationId}`
          );
      }
      const price =
        variation?.discountPrice ??
        variation?.price ??
        product?.discountPrice ??
        product?.price ??
        null;

      if (price === null)
        throw new ApiError(400, `No price defined for product ${productId}`);

      const willDeductStock =
        data.paymentStatus === "paid" || data.orderStatus === "completed";

      if (willDeductStock) {
        const availableStock = variation
          ? variation.stock
          : (product.totalStock ?? 0);
        if (availableStock < quantity) {
          throw new ApiError(
            400,
            `Insufficient stock for ${variation ? `variation ${variationId}` : `product ${productId}`} (requested ${quantity}, available ${availableStock})`
          );
        }
      }

      const lineSubtotal = Number(price) * Number(quantity);
      subtotal += lineSubtotal;

      itemsProcessed.push({
        productId: product._id,
        variationId: variation?._id,
        name: item.name || product.name,
        sku: item.sku || (variation ? variation.sku : product.sku),
        price,
        quantity,
        subtotal: lineSubtotal,
        status: "pending",
      });
    }

    // 2️⃣ Totals
    const discount = data.discount ?? 0;
    const tax = data.tax ?? 0;
    const shippingFee = data.shippingFee ?? 0;
    const total = subtotal - discount + tax + shippingFee;

    // 3️⃣ Order number
    const timestamp = new Date();
    const orderNumber =
      "ORD-" +
      timestamp.toISOString().slice(0, 10).replace(/-/g, "") +
      "-" +
      Math.floor(Math.random() * 9000 + 1000).toString();

    // 4️⃣ Create order
    const orderDoc = {
      orderNumber,
      customerId: data.customerId
        ? new mongoose.Types.ObjectId(data.customerId)
        : undefined,
      userId: data.userId,
      status: data.orderStatus || "pending",
      shippingStatus: data.paymentStatus === "paid" ? "processing" : "pending",
      paymentStatus: data.paymentStatus || "unpaid",
      paymentMethod: data.paymentMethod || "other",
      items: itemsProcessed,
      subtotal,
      channel: data.channel,
      discount,
      tax,
      shippingFee,
      total,
      shippingAddress: data.shippingAddress,
      note: data.note,
    };

    const [order] = await Order.create([orderDoc], { session });

    // inside your transaction/session block
    // map to store the initial total stock for each product processed in this order
    const initialProductTotals = new Map<string, number>();

    if (order.paymentStatus === "paid" || order.status === "completed") {
      for (const it of order.items) {
        const productIdStr = String(it.productId);

        // fetch product fresh using session
        const product = await Product.findById(it.productId).session(session);
        if (!product)
          throw new ApiError(404, `Product not found: ${it.productId}`);

        // store initial product total stock once per product (so multiple items for same product in order are consistent)
        if (!initialProductTotals.has(productIdStr)) {
          initialProductTotals.set(productIdStr, product.totalStock ?? 0);
        }
        const qtyBeforeProduct = initialProductTotals.get(productIdStr) ?? 0;

        // fetch variation if exists
        const variation = it.variationId
          ? await ProductVariation.findById(it.variationId).session(session)
          : null;

        // qty change at product level will be negative of ordered quantity
        const qtyChangeForProduct = -it.quantity;

        // update variation if present
        if (variation) {
          variation.stock = Math.max(0, (variation.stock ?? 0) - it.quantity);
          await variation.save({ session });

          // Recalculate product total from all variations (if you have variations)
          const allVars = await ProductVariation.find({
            productId: product._id,
          }).session(session);
          const newTotalFromVars = allVars.reduce(
            (sum, v) => sum + (v.stock ?? 0),
            0
          );
          product.totalStock = newTotalFromVars;
        } else {
          // product without variation: deduct directly
          product.totalStock = Math.max(
            0,
            (product.totalStock ?? 0) - it.quantity
          );
        }
        // save product after updating
        await product.save({ session }).then(async (savedProduct) => {
          if (savedProduct.totalStock <= 3) {
            createLowStockTodo({
              userId: String(savedProduct.userId),
              productId: String(savedProduct._id),
              productName: savedProduct.name,
              currentStock: savedProduct.totalStock,
            });
          } else {
            await Todo.deleteMany({
              userId: String(savedProduct.userId),
              "metadata.productId": String(savedProduct._id),
              type: "low_stock",
            });
          }
        });

        // qtyAfter should always reflect the current product.totalStock (after the update)
        const qtyAfterProduct = product.totalStock ?? 0;

        // compute qtyChange recorded in history (qtyAfter - qtyBefore)
        // keep negative sign for sold (-n)
        const recordedQtyChange = qtyAfterProduct - qtyBeforeProduct; // should be negative for sold

        // Create ProductHistory entry - use product-level before/after
        await ProductHistory.create(
          [
            {
              productId: product._id,
              variationId: variation?._id ?? null,
              source: "Order",
              activity: "sold",
              qtyBefore: qtyBeforeProduct,
              qtyChange: recordedQtyChange,
              qtyAfter: qtyAfterProduct,
            },
          ],
          { session }
        );
      }
    }

    const reference = crypto.randomUUID();
    if (order.channel === "physical") {
      const payment = await Payment.create({
        orderId: order._id,
        userId: order.userId,
        reference,
        method: order.paymentMethod,
        channel: order.channel,
        ...(order.paymentStatus === "paid" && { paidAt: new Date() }),
        status: order.paymentStatus === "paid" ? "paid" : "pending",
        orderNumber: order.orderNumber,
        amount: order.total,
        customerEmail: order?.shippingAddress?.email,
      });

      if (payment.status === "paid") {
        const wallet = await Wallet.findOne({ userId: order.userId });
        if (wallet) {
          wallet.pendingBalance += order.total;
          await wallet.save();
        }
      }
    }

    if (order.paymentStatus === "paid") {
      await createOrderShippingTodo({
        userId: data.userId,
        orderId: String(order._id),
        orderName: order.orderNumber,
      });
    } else {
      await createOrderPendingPaymentTodo({
        userId: data.userId,
        orderId: String(order._id),
        orderName: order.orderNumber,
      });
    }

    // 6️⃣ Commit & return
    await session.commitTransaction();
    session.endSession();

    return new ApiResponse(201, "Order created successfully", order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getOrdersService = async ({
  userId,
  page = 1,
  limit = 20,
  status,
  paymentStatus,
  paymentMethod,
  search,
  startDate,
  endDate,
}: GetOrdersParams) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, `User not found: ${userId}`);

  // Convert query strings to numbers safely
  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 20;

  const filters: any = {};

  if (status) filters.status = status;
  filters.userId = userId;
  if (paymentStatus) filters.paymentStatus = paymentStatus;
  if (paymentMethod) filters.paymentMethod = paymentMethod;

  if (startDate && endDate) {
    filters.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // 🔍 Search by orderNumber or customer name
  if (search) {
    filters.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { "shippingAddress.fullName": { $regex: search, $options: "i" } },
    ];
  }

  const skip = (currentPage - 1) * perPage;

  const [orders, total] = await Promise.all([
    Order.find(filters)
      .populate("customerId", "firstname lastname email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage),
    Order.countDocuments(filters),
  ]);

  // if (!orders.length) {
  //   throw new ApiError(404, "No orders found");
  // }

  return new ApiResponse(200, "Orders retrieved successfully", {
    total,
    currentPage,
    totalPages: Math.ceil(total / perPage),
    orders,
  });
};

export const getOrderByIdService = async (id: string) => {
  const order = await Order.findById(id)
    .populate("customerId", "firstname lastname email")
    .populate("items.productId", "name price images sku")
    .lean();

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return new ApiResponse(200, "Order retrieved successfully", order);
};

export const getOrderStatsService = async (userId: string) => {
  // 1) Ensure user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // 2) Aggregate order stats for this user
  const result = await Order.aggregate([
    {
      // filter by userId field on orders
      $match: { userId: new Types.ObjectId(userId) },
    },
    {
      // group to compute counts and revenue (only count revenue for paid orders)
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
        pending: {
          $sum: {
            $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
          },
        },
        cancelled: {
          $sum: {
            $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
          },
        },
        refunded: {
          $sum: {
            $cond: [{ $eq: ["$status", "refunded"] }, 1, 0],
          },
        },
        revenue: {
          $sum: {
            $cond: [
              { $eq: ["$paymentStatus", "paid"] },
              { $ifNull: ["$total", 0] },
              0,
            ],
          },
        },
      },
    },
  ]);

  // 3) If no aggregation result, return zeroed stats (no orders for this user)
  const stats = result[0] || {
    totalOrders: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    refunded: 0,
    revenue: 0,
  };

  // 4) Return a structured ApiResponse
  return new ApiResponse(200, "Order statistics retrieved successfully", {
    totalOrders: stats.totalOrders,
    completed: stats.completed,
    pending: stats.pending,
    cancelled: stats.cancelled,
    refunded: stats.refunded,
    revenue: stats.revenue,
  });
};

export const cancelOrderService = async (id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Find order
    const order = await Order.findById(id).session(session);
    if (!order) throw new ApiError(404, "Order not found");

    if (order.status === "cancelled") {
      throw new ApiError(400, "Order is already cancelled");
    }

    if (
      order.paymentStatus === "paid" &&
      order.shippingStatus === "delivered"
    ) {
      throw new ApiError(400, "Order delivered can't be cancelled");
    }

    // 2️⃣ If order was paid or completed, revert stock and create reverse ProductHistory
    if (
      order.paymentStatus === "paid" &&
      (order.shippingStatus === "pending" ||
        order.shippingStatus === "processing")
    ) {
      for (const item of order.items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product)
          throw new ApiError(404, `Product not found: ${item.productId}`);

        const variation = item.variationId
          ? await ProductVariation.findById(item.variationId).session(session)
          : null;

        // 🧮 Get the last ProductHistory entry for this product
        const lastHistory = await ProductHistory.findOne({
          productId: product._id,
        })
          .sort({ createdAt: -1 })
          .session(session);

        const qtyBefore = lastHistory
          ? lastHistory.qtyAfter
          : (product.totalStock ?? 0);
        const qtyChange = item.quantity; // Adding stock back
        const qtyAfter = qtyBefore + qtyChange;

        // 🪶 Update variation or product stock
        if (variation) {
          variation.stock = (variation.stock ?? 0) + item.quantity;
          await variation.save({ session });

          // Recalculate total stock for product
          const allVars = await ProductVariation.find({
            productId: product._id,
          }).session(session);
          const total = allVars.reduce((sum, v) => sum + (v.stock ?? 0), 0);
          product.totalStock = total;
        } else {
          product.totalStock = (product.totalStock ?? 0) + item.quantity;
        }

        await product.save({ session }).then(async (savedProduct) => {
          if (savedProduct.totalStock <= 3) {
            createLowStockTodo({
              userId: String(savedProduct.userId),
              productId: String(savedProduct._id),
              productName: savedProduct.name,
              currentStock: savedProduct.totalStock,
            });
          } else {
            await Todo.deleteMany({
              userId: String(savedProduct.userId),
              "metadata.productId": String(savedProduct._id),
              type: "low_stock",
            });
          }
        });

        // 🪶 Log the reversal in ProductHistory
        await ProductHistory.create(
          [
            {
              productId: product._id,
              variationId: variation?._id,
              source: "Order",
              activity: "returned",
              qtyBefore,
              qtyChange,
              qtyAfter,
            },
          ],
          { session }
        );
      }
    }

    const payment = await Payment.findOne({ orderId: order._id }).session(
      session
    );
    if (payment?.status === "refunded") {
      throw new ApiError(400, "Payment already refunded");
    }

    if (payment && order.channel === "physical") {
      payment.status = "failed";
      await payment.save();
    }
    if (
      order.paymentStatus === "paid" &&
      order.shippingStatus !== "delivered"
    ) {
      // Need to do paystack refund call here before updating db
      if (payment) {
        payment.status = "refunded";
        await payment.save();
      }
      await Wallet.updateOne(
        { userId: order.userId },
        {
          $inc: {
            pendingBalance: -order.total,
            refund: order.total, // optional but recommended
          },
        },
        { session }
      );
    }
    if (order.channel === "website") {
    }

    // 3️⃣ Update order status
    order.status = "cancelled";
    order.shippingStatus = "cancelled";
    order.paymentStatus =
      order.paymentStatus === "paid" ? "refunded" : "unpaid";
    await order.save({ session }).then(async (savedOrder) => {
      await Todo.deleteMany({
        userId: String(savedOrder.userId),
        "metadata.orderId": String(savedOrder._id),
        type: "order_pending_payment",
      });
      await Todo.deleteMany({
        userId: String(savedOrder.userId),
        "metadata.orderId": String(savedOrder._id),
        type: "order_needs_shipping",
      });
    });

    // 4️⃣ Commit transaction
    await session.commitTransaction();
    session.endSession();

    return new ApiResponse(200, "Order cancelled successfully", order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const updateOrderStatusService = async (id: string, status: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Find the order
    const order = await Order.findById(id).session(session);
    if (!order) throw new ApiError(404, "Order not found");

    const oldStatus = order.status;
    if (oldStatus === status) {
      throw new ApiError(400, `Order is already ${status}`);
    }

    // --- Handle transition logic ---

    /**
     * COMPLETED → Deduct stock + record sold history
     */
    if (status === "completed" && oldStatus !== "completed") {
      const initialProductTotals = new Map<string, number>();

      for (const item of order.items) {
        const productIdStr = String(item.productId);

        const product = await Product.findById(item.productId).session(session);
        if (!product)
          throw new ApiError(404, `Product not found: ${item.productId}`);

        // store qtyBefore ONCE per product
        if (!initialProductTotals.has(productIdStr)) {
          initialProductTotals.set(productIdStr, product.totalStock ?? 0);
        }
        const qtyBefore = initialProductTotals.get(productIdStr) ?? 0;

        const variation = item.variationId
          ? await ProductVariation.findById(item.variationId).session(session)
          : null;

        // Deduction
        if (variation) {
          variation.stock = Math.max(0, (variation.stock ?? 0) - item.quantity);
          await variation.save({ session });

          const allVars = await ProductVariation.find({
            productId: product._id,
          }).session(session);
          product.totalStock = allVars.reduce(
            (sum, v) => sum + (v.stock ?? 0),
            0
          );
        } else {
          product.totalStock = Math.max(
            0,
            (product.totalStock ?? 0) - item.quantity
          );
        }

        await product.save({ session }).then(async (savedProduct) => {
          if (savedProduct.totalStock <= 3) {
            createLowStockTodo({
              userId: String(savedProduct.userId),
              productId: String(savedProduct._id),
              productName: savedProduct.name,
              currentStock: savedProduct.totalStock,
            });
          } else {
            await Todo.deleteMany({
              userId: String(savedProduct.userId),
              "metadata.productId": String(savedProduct._id),
              type: "low_stock",
            });
          }
        });

        const qtyAfter = product.totalStock ?? 0;
        const qtyChange = qtyAfter - qtyBefore;

        await ProductHistory.create(
          [
            {
              productId: product._id,
              variationId: variation?._id ?? null,
              source: "Order",
              activity: "sold",
              qtyBefore,
              qtyChange,
              qtyAfter,
              referenceId: order._id,
            },
          ],
          { session }
        );
      }

      order.paymentStatus = "paid";
      order.shippingStatus = "processing";
    }

    /**
     * CANCELLED → Restock only if previously completed
     */
    if (status === "cancelled") {
      if (oldStatus === "completed") {
        const initialProductTotals = new Map<string, number>();

        for (const item of order.items) {
          const productIdStr = String(item.productId);

          const product = await Product.findById(item.productId).session(
            session
          );
          if (!product)
            throw new ApiError(404, `Product not found: ${item.productId}`);

          if (!initialProductTotals.has(productIdStr)) {
            initialProductTotals.set(productIdStr, product.totalStock ?? 0);
          }
          const qtyBefore = initialProductTotals.get(productIdStr) ?? 0;

          const variation = item.variationId
            ? await ProductVariation.findById(item.variationId).session(session)
            : null;

          // Restock
          if (variation) {
            variation.stock = (variation.stock ?? 0) + item.quantity;
            await variation.save({ session });

            const allVars = await ProductVariation.find({
              productId: product._id,
            }).session(session);
            product.totalStock = allVars.reduce(
              (sum, v) => sum + (v.stock ?? 0),
              0
            );
          } else {
            product.totalStock = (product.totalStock ?? 0) + item.quantity;
          }

          await product.save({ session }).then(async (savedProduct) => {
            if (savedProduct.totalStock <= 3) {
              createLowStockTodo({
                userId: String(savedProduct.userId),
                productId: String(savedProduct._id),
                productName: savedProduct.name,
                currentStock: savedProduct.totalStock,
              });
            } else {
              await Todo.deleteMany({
                userId: String(savedProduct.userId),
                "metadata.productId": String(savedProduct._id),
                type: "low_stock",
              });
            }
          });

          const qtyAfter = product.totalStock ?? 0;
          const qtyChange = qtyAfter - qtyBefore;

          await ProductHistory.create(
            [
              {
                productId: product._id,
                variationId: variation?._id ?? null,
                source: "Order",
                activity: "returned",
                qtyBefore,
                qtyChange,
                qtyAfter,
                referenceId: order._id,
              },
            ],
            { session }
          );
        }

        order.paymentStatus =
          order.paymentStatus === "paid" ? "refunded" : "unpaid";
      } else {
        order.paymentStatus =
          order.paymentStatus === "paid" ? "refunded" : "unpaid";
      }

      order.shippingStatus = "cancelled";
    }

    // 3️⃣ Save order with new status
    order.status = status;
    await order.save({ session }).then(async (savedOrder) => {
      if (
        savedOrder.paymentStatus === "paid" ||
        savedOrder.paymentStatus === "refunded"
      ) {
        await Todo.deleteMany({
          userId: String(savedOrder.userId),
          "metadata.orderId": String(savedOrder._id),
          type: "order_pending_payment",
        });
        await createOrderShippingTodo({
          userId: String(savedOrder.userId),
          orderId: String(savedOrder._id),
          orderName: savedOrder.orderNumber,
        });
      }
    });

    await session.commitTransaction();
    session.endSession();

    return new ApiResponse(200, "Order status updated successfully", order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const updateOrderPaymentService = async (
  id: string,
  paymentStatus: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Find order
    const order = await Order.findById(id).session(session);
    if (!order) throw new ApiError(404, "Order not found");

    const oldPaymentStatus = order.paymentStatus;
    if (oldPaymentStatus === paymentStatus) {
      throw new ApiError(400, `Order payment is already ${paymentStatus}`);
    }

    // 2️⃣ Handle transitions
    if (paymentStatus === "paid" && oldPaymentStatus !== "paid") {
      const initialProductTotals = new Map<string, number>();

      for (const item of order.items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product)
          throw new ApiError(404, `Product not found: ${item.productId}`);

        const variation = item.variationId
          ? await ProductVariation.findById(item.variationId).session(session)
          : null;

        const productIdStr = String(product._id);

        // Check if stock already deducted for THIS order + THIS variation
        const alreadySold = await ProductHistory.findOne({
          productId: product._id,
          variationId: variation?._id ?? null,
          source: "Order",
          sourceId: order._id,
          activity: "sold",
        }).session(session);

        if (alreadySold) continue;

        // Store initial product stock ONCE like create-order does
        if (!initialProductTotals.has(productIdStr)) {
          initialProductTotals.set(productIdStr, product.totalStock ?? 0);
        }
        const qtyBeforeProduct = initialProductTotals.get(productIdStr) ?? 0;

        // Deduct variation-level stock
        if (variation) {
          variation.stock = Math.max(0, (variation.stock ?? 0) - item.quantity);
          await variation.save({ session });

          const allVars = await ProductVariation.find({
            productId: product._id,
          }).session(session);
          product.totalStock = allVars.reduce(
            (sum, v) => sum + (v.stock ?? 0),
            0
          );
        } else {
          product.totalStock = Math.max(
            0,
            (product.totalStock ?? 0) - item.quantity
          );
        }

        await product.save({ session }).then(async (savedProduct) => {
          if (savedProduct.totalStock <= 3) {
            createLowStockTodo({
              userId: String(savedProduct.userId),
              productId: String(savedProduct._id),
              productName: savedProduct.name,
              currentStock: savedProduct.totalStock,
            });
          } else {
            await Todo.deleteMany({
              userId: String(savedProduct.userId),
              "metadata.productId": String(savedProduct._id),
              type: "low_stock",
            });
          }
        });

        const qtyAfterProduct = product.totalStock ?? 0;

        const recordedQtyChange = qtyAfterProduct - qtyBeforeProduct;

        await ProductHistory.create(
          [
            {
              productId: product._id,
              variationId: variation?._id ?? null,
              source: "Order",
              sourceId: order._id,
              activity: "sold",
              qtyBefore: qtyBeforeProduct,
              qtyChange: recordedQtyChange,
              qtyAfter: qtyAfterProduct,
            },
          ],
          { session }
        );
      }

      order.status = "completed";
      order.shippingStatus = "processing";
    }

    // 🔁 Handle refund → restock
    if (paymentStatus === "refunded" && oldPaymentStatus === "paid") {
      for (const item of order.items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product)
          throw new ApiError(404, `Product not found: ${item.productId}`);

        const variation = item.variationId
          ? await ProductVariation.findById(item.variationId).session(session)
          : null;

        const qtyBefore = variation
          ? variation.stock
          : (product.totalStock ?? 0);
        const qtyChange = item.quantity;

        if (variation) {
          variation.stock = (variation.stock ?? 0) + item.quantity;
          await variation.save({ session });

          const allVars = await ProductVariation.find({
            productId: product._id,
          }).session(session);

          product.totalStock = allVars.reduce(
            (sum, v) => sum + (v.stock ?? 0),
            0
          );
        } else {
          product.totalStock = qtyBefore + qtyChange;
        }

        await product.save({ session }).then(async (savedProduct) => {
          if (savedProduct.totalStock <= 3) {
            createLowStockTodo({
              userId: String(savedProduct.userId),
              productId: String(savedProduct._id),
              productName: savedProduct.name,
              currentStock: savedProduct.totalStock,
            });
          } else {
            await Todo.deleteMany({
              userId: String(savedProduct.userId),
              "metadata.productId": String(savedProduct._id),
              type: "low_stock",
            });
          }
        });

        await ProductHistory.create(
          [
            {
              productId: product._id,
              variationId: variation?._id,
              source: "Order",
              sourceId: order._id,
              activity: "returned",
              qtyBefore,
              qtyChange,
              qtyAfter: variation ? variation.stock : product.totalStock,
            },
          ],
          { session }
        );
      }

      order.status = "cancelled";
      order.shippingStatus = "cancelled";
    }

    // 3️⃣ Save updates
    order.paymentStatus = paymentStatus;
    await order.save({ session }).then(async (savedOrder) => {
      if (
        savedOrder.paymentStatus === "paid" ||
        savedOrder.paymentStatus === "refunded"
      ) {
        await Todo.deleteMany({
          userId: String(savedOrder.userId),
          "metadata.orderId": String(savedOrder._id),
          type: "order_pending_payment",
        });
        await createOrderShippingTodo({
          userId: String(savedOrder.userId),
          orderId: String(savedOrder._id),
          orderName: savedOrder.orderNumber,
        });
        const payment = await Payment.findOne({ orderId: order._id }).session(
          session
        );
        if (payment?.status === "refunded") {
          throw new ApiError(400, "Payment already refunded");
        }

        const wallet = await Wallet.findOne({ userId: order.userId });
        if (payment && payment.status !== "paid") {
          payment.status = "paid";
          payment.paidAt = new Date();
          await payment.save();
          if (wallet) {
            wallet.pendingBalance += order.total;
            await wallet.save();
          }
        }
      }
    });
    await session.commitTransaction();
    session.endSession();

    return new ApiResponse(200, "Payment status updated successfully", order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const updateOrderShippingService = async (
  id: string,
  shippingStatus: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Find the order
    const order = await Order.findById(id).session(session);
    if (!order) throw new ApiError(404, "Order not found");

    const oldShippingStatus: shippingStatus =
      order.shippingStatus as shippingStatus;

    if (oldShippingStatus === shippingStatus) {
      throw new ApiError(400, `Shipping status is already '${shippingStatus}'`);
    }

    // 2️⃣ Validate transitions (optional but recommended)
    const validTransitions: any = {
      pending: ["processing"],
      processing: ["shipped"],
      shipped: ["delivered"],
      delivered: [], // final state
    };

    if (!validTransitions[oldShippingStatus].includes(shippingStatus)) {
      throw new ApiError(
        400,
        `Invalid transition: cannot move shipping status from '${oldShippingStatus}' to '${shippingStatus}'`
      );
    }

    // 3️⃣ Update
    order.shippingStatus = shippingStatus;

    await order.save({ session }).then(async (savedOrder) => {
      // Clean up any past shipping todos for this order

      if (shippingStatus === "delivered") {
        await Todo.deleteMany({
          userId: String(savedOrder.userId),
          "metadata.orderId": String(savedOrder._id),
          type: "order_needs_shipping",
        });
        const wallet = await Wallet.findOne({ userId: order.userId });
        if (wallet) {
          if (savedOrder.channel === "physical") {
            wallet.pendingBalance -= order.total;
            wallet.offlineTransaction += order.total;
            await wallet.save();
          } else {
            wallet.pendingBalance -= order.total;
            wallet.availableBalance += order.total;
            await wallet.save();
          }
        }
      }
    });

    await session.commitTransaction();
    session.endSession();

    return new ApiResponse(200, "Shipping status updated successfully", order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
