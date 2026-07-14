import { Request, Response } from "express";
import { handleControllerError } from "../lib/http-error";
import * as SettingService from "../services/setting.service";

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await SettingService.getSettings(req.user);
    res.json(settings);
  } catch (error) {
    handleControllerError(error, req, res, "Failed to get settings");
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
  } catch (error) {
    handleControllerError(error, req, res, "Failed to save setting");
  }
}

export async function deleteSetting(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    await SettingService.deleteSetting(req.params.id, req.user);
    res.json({ message: "Setting deleted successfully" });
  } catch (error) {
    handleControllerError(error, req, res, "Failed to delete setting");
  }
}
