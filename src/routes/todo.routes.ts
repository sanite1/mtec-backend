import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import { getTodos } from "../controllers/todo.controller";
import { getTodosValidation } from "../validations/todo.validation";

const router = Router();

// GET /api/todos/:userId
router.route("/:userId").get(isAuthenticated, getTodosValidation(), getTodos);
