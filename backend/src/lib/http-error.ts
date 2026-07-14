import { Request, Response } from "express";
import { Prisma } from "@prisma/client";

type ErrorWithStatus = Error & {
  statusCode?: number;
};

function getStatusCode(error: unknown) {
  if (
    error instanceof Error &&
    "statusCode" in error &&
    Number.isInteger((error as ErrorWithStatus).statusCode)
  ) {
    const statusCode = (error as ErrorWithStatus).statusCode;

    if (statusCode && statusCode >= 400 && statusCode < 600) {
      return statusCode;
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002" || error.code === "P2003") {
      return 409;
    }

    if (error.code === "P2025") {
      return 404;
    }
  }

  return 500;
}

function getClientMessage(error: unknown, fallbackMessage: string) {
  if (
    error instanceof Error &&
    "statusCode" in error &&
    (error as ErrorWithStatus).statusCode
  ) {
    return error.message;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "A record with this value already exists.";
    }

    if (error.code === "P2003") {
      return "This record is still used by other data. Reassign or remove related records first.";
    }

    if (error.code === "P2025") {
      return "Record not found.";
    }
  }

  if (error instanceof Error && error.message === "Tenant is required") {
    return "Tenant is required for this action.";
  }

  return fallbackMessage;
}

export function handleControllerError(
  error: unknown,
  req: Request,
  res: Response,
  fallbackMessage: string
) {
  const statusCode = getStatusCode(error);
  const message = getClientMessage(error, fallbackMessage);

  console.error("Controller error", {
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.id,
    tenantId: req.user?.tenantId,
    statusCode,
    error,
  });

  res.status(statusCode).json({ message });
}
