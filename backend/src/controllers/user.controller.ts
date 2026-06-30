import { Request, Response } from "express";
import * as UserService from "../services/user.service";

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await UserService.getUsers(req.user);
    res.json(users);
  } catch {
    res.status(500).json({ message: "Failed to get users" });
  }
}

export async function getAssignableUsers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const users = await UserService.getAssignableUsers(req.user);
    res.json(users);
  } catch {
    res.status(500).json({ message: "Failed to get assignable users" });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({ message: "All user fields are required" });
      return;
    }

    const user = await UserService.createUser(req.body);
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    res.status(500).json({ message });
  }
}

export async function updateUser(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    res.json({ message: "User updated successfully", user });
  } catch {
    res.status(500).json({ message: "Failed to update user" });
  }
}

export async function deleteUser(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    await UserService.deleteUser(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete user" });
  }
}
