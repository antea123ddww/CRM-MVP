import { Request, Response } from "express";
import * as ActivityService from "../services/activity.service";

export async function getActivities(req: Request, res: Response): Promise<void> {
  try {
    const activities = await ActivityService.getActivities(req.user);
    res.json(activities);
  } catch {
    res.status(500).json({ message: "Failed to get activities" });
  }
}

export async function createActivity(req: Request, res: Response): Promise<void> {
  try {
    const { type, title, companyId } = req.body;

    if (!type || !title || !companyId) {
      res.status(400).json({ message: "type, title and companyId are required" });
      return;
    }

    const activity = await ActivityService.createActivity(req.body, req.user);

    res.status(201).json({
      message: "Activity created successfully",
      activity,
    });
  } catch {
    res.status(500).json({ message: "Failed to create activity" });
  }
}

export async function updateActivity(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const { type, title, companyId } = req.body;

    if (!type || !title || !companyId) {
      res.status(400).json({ message: "type, title and companyId are required" });
      return;
    }

    const activity = await ActivityService.updateActivity(req.params.id, req.body);

    res.json({
      message: "Activity updated successfully",
      activity,
    });
  } catch {
    res.status(500).json({ message: "Failed to update activity" });
  }
}

export async function deleteActivity(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    await ActivityService.deleteActivity(req.params.id);
    res.json({ message: "Activity deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete activity" });
  }
}
