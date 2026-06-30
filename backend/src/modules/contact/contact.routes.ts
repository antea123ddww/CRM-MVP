import { Router } from "express";
import { Role } from "@prisma/client";
import { roleMiddleware } from "../../middleware/role";
import {
  createContact,
  deleteContact,
  getContactById,
  getContacts,
  updateContact,
} from "./contact.controller";
import { authMiddleware } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createContactSchema,
  updateContactSchema,
} from "../../validators/contact.schema";

const router = Router();

 
router.get("/", authMiddleware, roleMiddleware([Role.ADMIN]), getContacts);
router.get("/:id", authMiddleware, roleMiddleware([Role.ADMIN]), getContactById);
router.post("/", authMiddleware, roleMiddleware([Role.ADMIN]), validate(createContactSchema), createContact);
router.put("/:id", authMiddleware, roleMiddleware([Role.ADMIN]), validate(updateContactSchema), updateContact);
router.delete("/:id", authMiddleware, roleMiddleware([Role.ADMIN]), deleteContact);

export default router;
