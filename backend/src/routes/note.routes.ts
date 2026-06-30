import { Router } from "express";
import { Role } from "@prisma/client";
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from "../controllers/note.controller";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { validate } from "../middleware/validate";
import { createNoteSchema, updateNoteSchema } from "../validators/note.schema";

const router = Router();

router.get("/", authMiddleware, roleMiddleware([Role.ADMIN]), getNotes);
router.post("/", authMiddleware, roleMiddleware([Role.ADMIN]), validate(createNoteSchema), createNote);
router.put("/:id", authMiddleware, roleMiddleware([Role.ADMIN]), validate(updateNoteSchema), updateNote);
router.delete("/:id", authMiddleware, roleMiddleware([Role.ADMIN]), deleteNote);

export default router;
