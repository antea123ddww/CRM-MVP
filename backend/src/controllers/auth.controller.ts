import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import crypto from "crypto";

function createAccessToken(user: {
  id: string;
  email: string;
  role: Role;
  tenantId?: string | null;
}) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" }
  );
}

async function createRefreshToken(userId: string) {
  const refreshToken = crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return refreshToken;
}

function setSecurityCookies(
  res: Response,
  refreshToken: string,
  csrfToken: string
) {
  const secure = process.env.NODE_ENV === "production";

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.cookie("csrfToken", csrfToken, {
    sameSite: "strict",
    secure,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

export async function register(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, password, role, tenantId } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || Role.SALES,
        tenantId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        tenantId: true,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch {
    return res.status(500).json({ message: "Register failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    const refreshToken = await createRefreshToken(user.id);
    const csrfToken = crypto.randomUUID();
    setSecurityCookies(res, refreshToken, csrfToken);

    return res.json({
      message: "Login successful",
      token,
      refreshToken,
      csrfToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        tenantId: user.tenantId,
      },
    });
  } catch {
    return res.status(500).json({ message: "Login failed" });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token is required",
      });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({
        message: "Invalid or expired refresh token",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    const token = createAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    return res.json({
      message: "Token refreshed successfully",
      token,
    });
  } catch {
    return res.status(500).json({
      message: "Refresh token failed",
    });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.clearCookie("refreshToken");
    res.clearCookie("csrfToken");

    return res.json({
      message: "Logout successful",
    });
  } catch {
    return res.status(500).json({
      message: "Logout failed",
    });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        tenantId: true,
        createdAt: true,
      },
    });

    return res.json(user);
  } catch {
    return res.status(500).json({ message: "Failed to get user" });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomUUID();

    await prisma.passwordResetToken.create({
      data: {
        email,
        token: resetToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 15),
      },
    });

    return res.json({
      message: "Password reset token created",
      resetToken,
    });
  } catch {
    return res.status(500).json({ message: "Forgot password failed" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and password are required",
      });
    }

    const reset = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!reset || reset.expiresAt < new Date()) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: reset.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return res.json({
      message: "Password reset successfully",
    });
  } catch {
    return res.status(500).json({ message: "Reset password failed" });
  }
}

export async function csrf(req: Request, res: Response) {
  const csrfToken = crypto.randomUUID();
  const secure = process.env.NODE_ENV === "production";

  res.cookie("csrfToken", csrfToken, {
    sameSite: "strict",
    secure,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return res.json({ csrfToken });
}
