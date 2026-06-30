import { Request, Response } from "express";
import * as DashboardService from "../services/dashboard.service";

export async function getDashboardStats(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const stats = await DashboardService.getDashboardStats(req.user);

    res.json(stats);
  } catch {
    res.status(500).json({
      message: "Failed to get dashboard stats",
    });
  }
}
