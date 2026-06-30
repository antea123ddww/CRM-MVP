import { Request, Response } from "express";
import * as SettingService from "../services/setting.service";

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await SettingService.getSettings(req.user);
    res.json(settings);
  } catch {
    res.status(500).json({ message: "Failed to get settings" });
  }
}

export async function saveSetting(req: Request, res: Response): Promise<void> {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      res.status(400).json({ message: "key and value are required" });
      return;
    }

    const setting = await SettingService.upsertSetting({ key, value }, req.user);
    res.status(201).json({ message: "Setting saved successfully", setting });
  } catch {
    res.status(500).json({ message: "Failed to save setting" });
  }
}

export async function deleteSetting(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    await SettingService.deleteSetting(req.params.id, req.user);
    res.json({ message: "Setting deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete setting" });
  }
}
