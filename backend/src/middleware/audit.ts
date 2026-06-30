import { NextFunction, Request, Response } from "express";
import { createAuditLog } from "../services/audit.service";

const auditedMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.on("finish", () => {
    const path = req.originalUrl.split("?")[0];

    if (!auditedMethods.has(req.method) || !path.startsWith("/api/")) {
      return;
    }

    if (res.statusCode >= 400 || path.startsWith("/api/auth/login")) {
      return;
    }

    const [, , module = "unknown"] = path.split("/");
    const data = {
      action: req.method,
      module,
      details: `${req.method} ${req.originalUrl} - ${res.statusCode}`,
      ...(req.user?.id ? { userId: req.user.id } : {}),
      ...(req.user?.tenantId ? { tenantId: req.user.tenantId } : {}),
    };

    createAuditLog(data).catch((error) => {
      console.error("[audit] Failed to create audit log", error);
    });
  });

  next();
}
