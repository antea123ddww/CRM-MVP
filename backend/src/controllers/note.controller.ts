import { Request, Response } from "express";
import * as NoteService from "../services/note.service";

export async function getNotes(req: Request, res: Response): Promise<void> {
  try {
    const notes = await NoteService.getNotes(req.user);
    res.json(notes);
  } catch {
    res.status(500).json({ message: "Failed to get notes" });
  }
}

export async function createNote(req: Request, res: Response): Promise<void> {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ message: "content is required" });
      return;
    }

    const note = await NoteService.createNote(req.body, req.user);

    res.status(201).json({
      message: "Note created successfully",
      note,
    });
  } catch {
    res.status(500).json({ message: "Failed to create note" });
  }
}

export async function updateNote(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ message: "content is required" });
      return;
    }

    const note = await NoteService.updateNote(req.params.id, { content });
    res.json({ message: "Note updated successfully", note });
  } catch {
    res.status(500).json({ message: "Failed to update note" });
  }
}

export async function deleteNote(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    await NoteService.deleteNote(req.params.id);
    res.json({ message: "Note deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete note" });
  }
}
