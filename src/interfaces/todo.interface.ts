import { Types } from "mongoose";

export interface ITodo extends Document {
  userId: Types.ObjectId;

  title: string;
  description?: string;

  type:
    | "low_stock"
    | "order_pending"
    | "order_needs_shipping"
    | "incomplete_store_setup"
    | "missing_bank_info"
    | "new_message"
    | "unfulfilled_order"
    | "product_disabled"
    | "custom_task";

  metadata: Record<string, any>; // flexible payload

  actionUrl: string; // where clicking the todo should take the user

  priority: "low" | "medium" | "high";

  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TodoType =
  | "low_stock"
  | "order_pending"
  | "order_needs_shipping"
  | "incomplete_store_setup"
  | "missing_bank_info"
  | "new_message"
  | "unfulfilled_order"
  | "product_disabled"
  | "custom_task";

export interface CreateTodoArgs {
  userId: string;
  title: string;
  description?: string;
  type: TodoType;
  actionUrl: string;
  priority?: "low" | "medium" | "high";
  metadata?: Record<string, any>;
}
