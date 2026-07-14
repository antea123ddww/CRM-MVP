import { Request, Response } from "express";
import { handleControllerError } from "../lib/http-error";
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
  } catch (error) {
    handleControllerError(error, req, res, "Failed to get team performance");
  }
}
