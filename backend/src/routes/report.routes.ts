import { Router } from "express";
import { Role } from "@prisma/client";
import { getReports } from "../controllers/report.controller";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const router = Router();

router.get("/", authMiddleware, roleMiddleware([Role.ADMIN]), getReports);

export default router;
