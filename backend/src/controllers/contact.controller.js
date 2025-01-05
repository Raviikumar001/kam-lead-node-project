// src/controllers/contact.controller.js
import {
  createContact,
  updateContact,
  getContactsByLead,
  getContactById,
  deleteContact,
} from "../services/contact.service.js";
import { errorHandler } from "../utils/error.util.js";

export const createContactHandler = async (req, res) => {
  try {
    const { leadId, ...contactData } = req.body;
    const contact = await createContact(contactData, leadId, req.user.id);

    return res.status(201).json({
      status: "success",
      data: contact,
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

export const updateContactHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await updateContact(id, req.body, req.user.id);

    return res.status(200).json({
      status: "success",
      data: contact,
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

export const getContactsByLeadHandler = async (req, res) => {
  try {
    const { leadId } = req.params;
    const contacts = await getContactsByLead(leadId, req.user.id);

    return res.status(200).json({
      status: "success",
      data: contacts,
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

export const getContactByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await getContactById(id, req.user.id);

    return res.status(200).json({
      status: "success",
      data: contact,
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

export const deleteContactHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteContact(id, req.user.id);

    return res.status(200).json({
      status: "success",
      message: "Contact deleted successfully",
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};
