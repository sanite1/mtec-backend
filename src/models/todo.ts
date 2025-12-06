import { Schema, model } from "mongoose";
import { ITodo } from "../interfaces/todo.interface";

const TodoSchema = new Schema<ITodo>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: { type: String, required: true, trim: true },

    description: { type: String, trim: true },

    type: {
      type: String,
      enum: [
        "low_stock",
        "order_pending",
        "order_needs_shipping",
        "incomplete_store_setup",
        "missing_bank_info",
        "new_message",
        "unfulfilled_order",
        "product_disabled",
        "custom_task",
      ],
      required: true,
    },

    metadata: { type: Object, default: {} },

    actionUrl: { type: String, required: true },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    completed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Todo = model<ITodo>("Todo", TodoSchema);
