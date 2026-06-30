import { Router } from "express";
import { Role } from "@prisma/client";
import { roleMiddleware } from "../middleware/role";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
} from "../controllers/task.controller";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createTaskSchema, updateTaskSchema } from "../validators/task.schema";

const router = Router();


router.get("/", authMiddleware, roleMiddleware([Role.ADMIN, Role.SALES]), getTasks);
router.get("/:id", authMiddleware, roleMiddleware([Role.ADMIN, Role.SALES]), getTaskById);
router.post("/", authMiddleware, roleMiddleware([Role.ADMIN, Role.SALES]), validate(createTaskSchema), createTask);
router.put("/:id", authMiddleware, roleMiddleware([Role.ADMIN, Role.SALES]), validate(updateTaskSchema), updateTask);
router.delete("/:id", authMiddleware, roleMiddleware([Role.ADMIN, Role.SALES]), deleteTask);

export default router;
