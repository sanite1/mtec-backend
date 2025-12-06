import { Request, Response, NextFunction } from "express";
import { getTodosService } from "../services/todo.service";

export const getTodos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await getTodosService({ userId, ...req.query });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};
