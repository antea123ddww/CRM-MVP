import { Router } from "express";
import { Role } from "@prisma/client";
import {
  createUser,
  deleteUser,
  getAssignableUsers,
  getUsers,
  updateUser,
} from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const router = Router();

router.get(
  "/assignable",
  authMiddleware,
  roleMiddleware([Role.ADMIN, Role.MANAGER]),
  getAssignableUsers
);
router.get("/", authMiddleware, roleMiddleware([Role.ADMIN]), getUsers);
router.post("/", authMiddleware, roleMiddleware([Role.ADMIN]), createUser);
router.put("/:id", authMiddleware, roleMiddleware([Role.ADMIN]), updateUser);
router.delete("/:id", authMiddleware, roleMiddleware([Role.ADMIN]), deleteUser);

export default router;
