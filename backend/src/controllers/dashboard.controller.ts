import { Request, Response } from "express";
import { handleControllerError } from "../lib/http-error";
import * as DashboardService from "../services/dashboard.service";

export async function getDashboardStats(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const stats = await DashboardService.getDashboardStats(req.user);

    res.json(stats);
  } catch (error) {
    handleControllerError(error, req, res, "Failed to get dashboard stats");
  }
}
