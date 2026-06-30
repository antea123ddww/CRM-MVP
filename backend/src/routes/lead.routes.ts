import { Router } from "express";
import { Role } from "@prisma/client";
import { roleMiddleware } from "../middleware/role";
import {
  createLead,
  deleteLead,
  getLeadById,
  getLeads,
  updateLead,
} from "../controllers/lead.controller";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createLeadSchema, updateLeadSchema } from "../validators/lead.schema";

const router = Router();


router.get("/", authMiddleware, roleMiddleware([Role.ADMIN, Role.MANAGER, Role.SALES]), getLeads);
router.get("/:id", authMiddleware, roleMiddleware([Role.ADMIN, Role.MANAGER, Role.SALES]), getLeadById);
router.post("/", authMiddleware, roleMiddleware([Role.ADMIN, Role.SALES]), validate(createLeadSchema), createLead);
router.put("/:id", authMiddleware, roleMiddleware([Role.ADMIN, Role.MANAGER, Role.SALES]), validate(updateLeadSchema), updateLead);
router.delete("/:id", authMiddleware, roleMiddleware([Role.ADMIN, Role.SALES]), deleteLead);

export default router;
