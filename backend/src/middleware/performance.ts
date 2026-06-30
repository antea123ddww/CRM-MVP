import { NextFunction, Request, Response } from "express";

const RESPONSE_TIME_TARGET_MS = 300;

export function performanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    if (durationMs > RESPONSE_TIME_TARGET_MS) {
      console.warn(
        `[performance] ${req.method} ${req.originalUrl} took ${durationMs.toFixed(
          1
        )}ms`
      );
    }
  });

  res.setHeader("X-Response-Time-Target", `${RESPONSE_TIME_TARGET_MS}ms`);
  next();
}
