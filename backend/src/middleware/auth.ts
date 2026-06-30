import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

type JwtPayload = {
  id: string;
  email: string;
  role: Role;
  tenantId?: string | null;
};



export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized. Token missing." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    prisma.user
      .findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          tenantId: true,
        },
      })
      .then((user) => {
        if (!user || user.status !== UserStatus.ACTIVE) {
          return res.status(401).json({ message: "Unauthorized." });
        }

        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        };

        next();
      })
      .catch(() => {
        return res.status(401).json({ message: "Unauthorized." });
      });
  } catch {
    return res.status(401).json({ message: "Unauthorized. Invalid token." });
  }
}
