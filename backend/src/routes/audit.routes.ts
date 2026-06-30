import { Router } from "express";
import { Role } from "@prisma/client";
import { getAuditLogs } from "../controllers/audit.controller";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const router = Router();

router.get("/", authMiddleware, roleMiddleware([Role.ADMIN]), getAuditLogs);

export default router;
