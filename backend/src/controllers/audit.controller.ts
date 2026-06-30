import { Request, Response } from "express";
import * as AuditService from "../services/audit.service";

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const logs = await AuditService.getAuditLogs(req.user);

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to get audit logs",
    });
  }
}
