import mongoose, { Types } from "mongoose";
import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import {
  CreateOrderRequest,
  GetOrdersParams,
} from "../interfaces/order.interface";
import { Product, ProductHistory, ProductVariation } from "../models/product";
import Order from "../models/order";
import User from "../models/User";

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
      paymentStatus: data.paymentStatus || "unpaid",
      paymentMethod: data.paymentMethod || "other",
      items: itemsProcessed,
      subtotal,
      discount,
      tax,
      shippingFee,
      total,
      shippingAddress: data.shippingAddress,
      note: data.note,
    };

    const [order] = await Order.create([orderDoc], { session });

    // 5️⃣ Handle stock & product history if paid/completed
    if (order.paymentStatus === "paid" || order.status === "completed") {
      for (const it of order.items) {
        const product = await Product.findById(it.productId).session(session);
        if (!product)
          throw new ApiError(404, `Product not found: ${it.productId}`);

        const variation = it.variationId
          ? await ProductVariation.findById(it.variationId).session(session)
          : null;

        // 🧮 Always use product.totalStock for quantity tracking
        const lastHistory = await ProductHistory.findOne({
          productId: product._id,
        })
          .sort({ createdAt: -1 })
          .session(session);

        const qtyBefore = lastHistory
          ? lastHistory.qtyAfter
          : (product.totalStock ?? 0);

        const qtyChange = -it.quantity;
        const qtyAfter = Math.max(0, qtyBefore + qtyChange);

        // 🧾 Update variation & product stocks
        if (variation) {
          variation.stock = Math.max(0, variation.stock - it.quantity);
          await variation.save({ session });

          // Recalculate product total stock from all variations
          const allVars = await ProductVariation.find({
            productId: product._id,
          }).session(session);

          const newTotal = allVars.reduce((sum, v) => sum + (v.stock || 0), 0);
          product.totalStock = newTotal;
        } else {
          // If product has no variation, just deduct directly
          product.totalStock = qtyAfter;
        }

        await product.save({ session });

        // 🪶 Create ProductHistory entry (reflecting product-level totals)
        await ProductHistory.create(
          [
            {
              productId: product._id,
              variationId: variation?._id, // still record if a variant was involved
              source: "Order",
              activity: "sold",
              qtyBefore,
              qtyChange,
              qtyAfter: product.totalStock, // ✅ always reflect total product stock
            },
          ],
          { session }
        );
      }
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

  if (!orders.length) {
    throw new ApiError(404, "No orders found");
  }

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

  return new ApiResponse(200, "Order retrieved successfully", { order });
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

    // 2️⃣ If order was paid or completed, revert stock and create reverse ProductHistory
    if (order.paymentStatus === "paid" || order.status === "completed") {
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

        await product.save({ session });

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

    // 3️⃣ Update order status
    order.status = "cancelled";
    order.paymentStatus =
      order.paymentStatus === "paid" ? "refunded" : "unpaid";
    await order.save({ session });

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
     * ✅ When moving to COMPLETED
     * Deduct stock, record "sold" history, and mark payment as paid.
     */
    if (status === "completed" && oldStatus !== "completed") {
      for (const item of order.items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product)
          throw new ApiError(404, `Product not found: ${item.productId}`);

        const variation = item.variationId
          ? await ProductVariation.findById(item.variationId).session(session)
          : null;

        const qtyBefore = product.totalStock ?? 0;
        const qtyChange = -item.quantity;
        const qtyAfter = Math.max(0, qtyBefore + qtyChange);

        // 🔄 Update stock levels
        if (variation) {
          variation.stock = Math.max(0, (variation.stock ?? 0) - item.quantity);
          await variation.save({ session });

          // Recalculate total stock for product
          const allVars = await ProductVariation.find({
            productId: product._id,
          }).session(session);
          product.totalStock = allVars.reduce(
            (sum, v) => sum + (v.stock ?? 0),
            0
          );
        } else {
          product.totalStock = qtyAfter;
        }

        await product.save({ session });

        // 🪶 Add ProductHistory entry
        await ProductHistory.create(
          [
            {
              productId: product._id,
              variationId: variation?._id,
              source: "Order",
              activity: "sold",
              qtyBefore,
              qtyChange,
              qtyAfter: product.totalStock,
              referenceId: order._id,
            },
          ],
          { session }
        );
      }

      order.paymentStatus = "paid";
    }

    /**
     * ✅ When moving to CANCELLED
     * - If previously completed → restock and add "returned" history.
     * - If not completed → just mark as cancelled (no stock changes).
     */
    if (status === "cancelled") {
      if (oldStatus === "completed") {
        for (const item of order.items) {
          const product = await Product.findById(item.productId).session(
            session
          );
          if (!product)
            throw new ApiError(404, `Product not found: ${item.productId}`);

          const variation = item.variationId
            ? await ProductVariation.findById(item.variationId).session(session)
            : null;

          const qtyBefore = product.totalStock ?? 0;
          const qtyChange = item.quantity;
          const qtyAfter = qtyBefore + qtyChange;

          // 🔄 Update stock
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
            product.totalStock = qtyAfter;
          }

          await product.save({ session });

          // 🪶 Record "returned" ProductHistory entry
          await ProductHistory.create(
            [
              {
                productId: product._id,
                variationId: variation?._id,
                source: "Order",
                activity: "returned",
                qtyBefore,
                qtyChange,
                qtyAfter: product.totalStock,
                referenceId: order._id,
              },
            ],
            { session }
          );
        }

        // 🔁 Update payment status
        order.paymentStatus =
          order.paymentStatus === "paid" ? "refunded" : "unpaid";
      } else {
        // Not completed yet → no stock change
        order.paymentStatus =
          order.paymentStatus === "paid" ? "refunded" : "unpaid";
      }
    }

    // 3️⃣ Save order with new status
    order.status = status;
    await order.save({ session });

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
      // 💰 Mark as paid → Deduct stock if not yet deducted
      for (const item of order.items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product)
          throw new ApiError(404, `Product not found: ${item.productId}`);

        const variation = item.variationId
          ? await ProductVariation.findById(item.variationId).session(session)
          : null;

        // ✅ Check if this specific order already deducted stock
        const alreadySold = await ProductHistory.findOne({
          productId: product._id,
          variationId: variation ? variation._id : { $exists: false },
          source: "Order",
          sourceId: order._id, // associate with order
          activity: "sold",
        }).session(session);

        if (!alreadySold) {
          const qtyBefore = variation
            ? variation.stock
            : (product.totalStock ?? 0);
          const qtyChange = -item.quantity;

          // Update stock
          if (variation) {
            variation.stock = Math.max(0, variation.stock - item.quantity);
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

          await product.save({ session });

          await ProductHistory.create(
            [
              {
                productId: product._id,
                variationId: variation?._id,
                source: "Order",
                sourceId: order._id,
                activity: "sold",
                qtyBefore,
                qtyChange,
                qtyAfter: variation ? variation.stock : product.totalStock,
              },
            ],
            { session }
          );
        }
      }

      order.status = "completed"; // sync
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

        await product.save({ session });

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
    }

    // 3️⃣ Save updates
    order.paymentStatus = paymentStatus;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return new ApiResponse(200, "Payment status updated successfully", order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
