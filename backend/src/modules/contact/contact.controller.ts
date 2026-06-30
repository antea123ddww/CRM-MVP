import { Request, Response } from "express";
import * as ContactService from "./contact.service";

export const getContacts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const contacts = await ContactService.getContacts(search, req.user);

    res.status(200).json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get contacts" });
  }
};

export const getContactById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const contact = await ContactService.getContactById(
      req.params.id,
      req.user
    );

    if (!contact) {
      res.status(404).json({ message: "Contact not found" });
      return;
    }

    res.status(200).json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get contact" });
  }
};

export const createContact = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { firstName, lastName, companyId } = req.body;

    if (!firstName || !lastName || !companyId) {
      res.status(400).json({
        message: "firstName, lastName and companyId are required",
      });
      return;
    }

    const contact = await ContactService.createContact(req.body, req.user);

    res.status(201).json({
      message: "Contact created successfully",
      contact,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create contact" });
  }
};

export const updateContact = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const existing = await ContactService.getContactById(
      req.params.id,
      req.user
    );

    if (!existing) {
      res.status(404).json({ message: "Contact not found" });
      return;
    }

    const contact = await ContactService.updateContact(
      req.params.id,
      req.body
    );

    res.status(200).json({
      message: "Contact updated successfully",
      contact,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update contact" });
  }
};

export const deleteContact = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const existing = await ContactService.getContactById(
      req.params.id,
      req.user
    );

    if (!existing) {
      res.status(404).json({ message: "Contact not found" });
      return;
    }

    await ContactService.deleteContact(req.params.id);

    res.status(200).json({
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete contact" });
  }
};
