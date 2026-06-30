import { Router } from "express";
import { Role } from "@prisma/client";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const router = Router();

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware([Role.ADMIN, Role.MANAGER]),
  getDashboardStats
);

export default router;
