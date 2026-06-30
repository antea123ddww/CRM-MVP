import { Router } from "express";
import { Role } from "@prisma/client";
import {
  deleteSetting,
  getSettings,
  saveSetting,
} from "../controllers/setting.controller";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { validate } from "../middleware/validate";
import { saveSettingSchema } from "../validators/setting.schema";

const router = Router();
const adminOnly = [authMiddleware, roleMiddleware([Role.ADMIN])];

router.get("/", ...adminOnly, getSettings);
router.post("/", ...adminOnly, validate(saveSettingSchema), saveSetting);
router.delete("/:id", ...adminOnly, deleteSetting);

export default router;
