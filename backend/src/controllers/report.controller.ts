import { Request, Response } from "express";
import * as ReportService from "../services/report.service";

export async function getReports(req: Request, res: Response): Promise<void> {
  try {
    const reports = await ReportService.getReports(req.user);
    res.json(reports);
  } catch {
    res.status(500).json({
      message: "Failed to get reports",
    });
  }
}
