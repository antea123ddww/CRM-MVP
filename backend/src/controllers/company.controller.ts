import { Request, Response } from "express";
import { handleControllerError } from "../lib/http-error";
import * as CompanyService from "../services/company.service";

export async function getCompanies(req: Request, res: Response): Promise<void> {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const companies = await CompanyService.getCompanies(search, req.user);

    res.json(companies);
  } catch (error) {
    handleControllerError(error, req, res, "Failed to get companies");
  }
}

export async function getCompanyById(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const company = await CompanyService.getCompanyById(id, req.user);

    if (!company) {
      res.status(404).json({
        message: "Company not found",
      });
      return;
    }

    res.json(company);
  } catch (error) {
    handleControllerError(error, req, res, "Failed to get company");
  }
}

export async function createCompany(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({
        message: "Company name is required",
      });
      return;
    }

    const company = await CompanyService.createCompany(req.body, req.user);

    res.status(201).json({
      message: "Company created successfully",
      company,
    });
  } catch (error) {
    handleControllerError(error, req, res, "Failed to create company");
  }
}

export async function updateCompany(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await CompanyService.getCompanyById(id, req.user);

    if (!existing) {
      res.status(404).json({ message: "Company not found" });
      return;
    }

    const company = await CompanyService.updateCompany(id, req.body);

    res.json({
      message: "Company updated successfully",
      company,
    });
  } catch (error) {
    handleControllerError(error, req, res, "Failed to update company");
  }
}

export async function deleteCompany(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await CompanyService.getCompanyById(id, req.user);

    if (!existing) {
      res.status(404).json({ message: "Company not found" });
      return;
    }

    await CompanyService.deleteCompany(id);

    res.json({
      message: "Company deleted successfully",
    });
  } catch (error) {
    handleControllerError(error, req, res, "Failed to delete company");
  }
}
