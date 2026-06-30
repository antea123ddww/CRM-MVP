import { NextFunction, Request, Response } from "express";

const protectedMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const excludedPaths = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/csrf",
]);

export function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!protectedMethods.has(req.method) || excludedPaths.has(req.path)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || cookieToken !== headerToken) {
    res.status(403).json({ message: "Invalid CSRF token" });
    return;
  }

  next();
}
