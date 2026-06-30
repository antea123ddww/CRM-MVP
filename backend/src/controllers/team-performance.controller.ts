import { Request, Response } from "express";
import * as TeamPerformanceService from "../services/team-performance.service";

export async function getTeamPerformance(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const performance = await TeamPerformanceService.getTeamPerformance(
      req.user
    );

    res.json(performance);
  } catch {
    res.status(500).json({
      message: "Failed to get team performance",
    });
  }
}
