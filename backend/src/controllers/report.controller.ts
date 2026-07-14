import { Request, Response } from "express";
import { handleControllerError } from "../lib/http-error";
import * as ReportService from "../services/report.service";

export async function getReports(req: Request, res: Response): Promise<void> {
  try {
    const reports = await ReportService.getReports(req.user);
    res.json(reports);
  } catch (error) {
    handleControllerError(error, req, res, "Failed to get reports");
  }
}
