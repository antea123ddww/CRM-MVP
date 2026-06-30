import { Router } from "express";
import { Role } from "@prisma/client";
import { roleMiddleware } from "../middleware/role";
import {
  createDeal,
  deleteDeal,
  getDealById,
  getDeals,
  updateDeal,
} from "../controllers/deal.controller";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createDealSchema, updateDealSchema } from "../validators/deal.schema";

const router = Router();


router.get("/", authMiddleware, roleMiddleware([Role.ADMIN, Role.MANAGER, Role.SALES]), getDeals);
router.get("/:id", authMiddleware, roleMiddleware([Role.ADMIN, Role.MANAGER, Role.SALES]), getDealById);
router.post("/", authMiddleware, roleMiddleware([Role.ADMIN]), validate(createDealSchema), createDeal);
router.put("/:id", authMiddleware, roleMiddleware([Role.ADMIN, Role.MANAGER, Role.SALES]), validate(updateDealSchema), updateDeal);
router.delete("/:id", authMiddleware, roleMiddleware([Role.ADMIN]), deleteDeal);

export default router;
