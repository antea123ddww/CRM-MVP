import { Request, Response } from "express";
import * as LeadService from "../services/lead.service";

export async function getLeads(req: Request, res: Response): Promise<void> {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const leads = await LeadService.getLeads(search, req.user);
    res.json(leads);
  } catch {
    res.status(500).json({ message: "Failed to get leads" });
  }
}

export async function getLeadById(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const lead = await LeadService.getLeadById(req.params.id, req.user);

    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    res.json(lead);
  } catch {
    res.status(500).json({ message: "Failed to get lead" });
  }
}

export async function createLead(req: Request, res: Response): Promise<void> {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    const lead = await LeadService.createLead(req.body, req.user);

    res.status(201).json({
      message: "Lead created successfully",
      lead,
    });
  } catch {
    res.status(500).json({ message: "Failed to create lead" });
  }
}

export async function updateLead(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const existing = await LeadService.getLeadById(req.params.id, req.user);

    if (!existing) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    const lead = await LeadService.updateLead(req.params.id, req.body);

    res.json({
      message: "Lead updated successfully",
      lead,
    });
  } catch {
    res.status(500).json({ message: "Failed to update lead" });
  }
}

export async function deleteLead(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const existing = await LeadService.getLeadById(req.params.id, req.user);

    if (!existing) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    await LeadService.deleteLead(req.params.id);

    res.json({ message: "Lead deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete lead" });
  }
}
