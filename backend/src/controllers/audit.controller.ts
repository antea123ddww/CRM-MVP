import { Request, Response } from "express";
import { handleControllerError } from "../lib/http-error";
import * as AuditService from "../services/audit.service";

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const logs = await AuditService.getAuditLogs(req.user);

    res.json(logs);
  } catch (error) {
    handleControllerError(error, req, res, "Failed to get audit logs");
  }
}
