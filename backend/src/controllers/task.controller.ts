import { Request, Response } from "express";
import { handleControllerError } from "../lib/http-error";
import * as TaskService from "../services/task.service";

export async function getTasks(req: Request, res: Response): Promise<void> {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const tasks = await TaskService.getTasks(search, req.user);
    res.json(tasks);
  } catch (error) {
    handleControllerError(error, req, res, "Failed to get tasks");
  }
}

export async function getTaskById(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const task = await TaskService.getTaskById(req.params.id, req.user);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.json(task);
  } catch (error) {
    handleControllerError(error, req, res, "Failed to get task");
  }
}

export async function createTask(req: Request, res: Response): Promise<void> {
  try {
    const { title } = req.body;

    if (!title) {
      res.status(400).json({ message: "title is required" });
      return;
    }

    const task = await TaskService.createTask(req.body, req.user);

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    handleControllerError(error, req, res, "Failed to create task");
  }
}

export async function updateTask(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const existing = await TaskService.getTaskById(req.params.id, req.user);

    if (!existing) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const task = await TaskService.updateTask(req.params.id, req.body);

    res.json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    handleControllerError(error, req, res, "Failed to update task");
  }
}

export async function deleteTask(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const existing = await TaskService.getTaskById(req.params.id, req.user);

    if (!existing) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    await TaskService.deleteTask(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    handleControllerError(error, req, res, "Failed to delete task");
  }
}
