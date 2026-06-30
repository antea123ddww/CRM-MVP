import { Router } from "express";
import { Role } from "@prisma/client";
import {
  createActivity,
  deleteActivity,
  getActivities,
  updateActivity,
} from "../controllers/activity.controller";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { validate } from "../middleware/validate";
import {
  createActivitySchema,
  updateActivitySchema,
} from "../validators/activity.schema";

const router = Router();

router.get("/", authMiddleware, roleMiddleware([Role.ADMIN]), getActivities);
router.post("/", authMiddleware, roleMiddleware([Role.ADMIN]), validate(createActivitySchema), createActivity);
router.put("/:id", authMiddleware, roleMiddleware([Role.ADMIN]), validate(updateActivitySchema), updateActivity);
router.delete("/:id", authMiddleware, roleMiddleware([Role.ADMIN]), deleteActivity);

export default router;
