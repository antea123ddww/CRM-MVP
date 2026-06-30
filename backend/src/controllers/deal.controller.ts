import { Request, Response } from "express";
import * as DealService from "../services/deal.service";

export async function getDeals(req: Request, res: Response): Promise<void> {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const deals = await DealService.getDeals(search, req.user);
    res.json(deals);
  } catch {
    res.status(500).json({ message: "Failed to get deals" });
  }
}

export async function getDealById(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const deal = await DealService.getDealById(req.params.id, req.user);

    if (!deal) {
      res.status(404).json({ message: "Deal not found" });
      return;
    }

    res.json(deal);
  } catch {
    res.status(500).json({ message: "Failed to get deal" });
  }
}

export async function createDeal(req: Request, res: Response): Promise<void> {
  try {
    const { title, value, companyId } = req.body;

    if (!title || value === undefined || !companyId) {
      res.status(400).json({
        message: "title, value and companyId are required",
      });
      return;
    }

    const deal = await DealService.createDeal(req.body, req.user);

    res.status(201).json({
      message: "Deal created successfully",
      deal,
    });
  } catch {
    res.status(500).json({ message: "Failed to create deal" });
  }
}

export async function updateDeal(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const existing = await DealService.getDealById(req.params.id, req.user);

    if (!existing) {
      res.status(404).json({ message: "Deal not found" });
      return;
    }

    const deal = await DealService.updateDeal(req.params.id, req.body, req.user);

    res.json({
      message: "Deal updated successfully",
      deal,
    });
  } catch {
    res.status(500).json({ message: "Failed to update deal" });
  }
}

export async function deleteDeal(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const existing = await DealService.getDealById(req.params.id, req.user);

    if (!existing) {
      res.status(404).json({ message: "Deal not found" });
      return;
    }

    await DealService.deleteDeal(req.params.id);
    res.json({ message: "Deal deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete deal" });
  }
}
