import { Router } from "express";
import { Role } from "@prisma/client";
import { roleMiddleware } from "../middleware/role";
import {
  createCompany,
  deleteCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
} from "../controllers/company.controller";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createCompanySchema,
  updateCompanySchema,
} from "../validators/company.schema";

const router = Router();


router.get("/", authMiddleware, roleMiddleware([Role.ADMIN, Role.SALES]), getCompanies);
router.get("/:id", authMiddleware, roleMiddleware([Role.ADMIN, Role.SALES]), getCompanyById);
router.post("/", authMiddleware, roleMiddleware([Role.ADMIN]), validate(createCompanySchema), createCompany);
router.put("/:id", authMiddleware, roleMiddleware([Role.ADMIN]), validate(updateCompanySchema), updateCompany);
router.delete("/:id", authMiddleware, roleMiddleware([Role.ADMIN]), deleteCompany);

export default router;
