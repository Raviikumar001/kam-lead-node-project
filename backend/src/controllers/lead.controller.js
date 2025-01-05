// src/controllers/lead.controller.js
import { LeadService } from "../services/lead.service.js";

const leadService = new LeadService();

export const createLead = async (req, res) => {
  try {
    const lead = await leadService.createLead(req.body, req.user.id);

    return res.status(201).json({
      status: "success",
      data: lead,
    });
  } catch (error) {
    console.error("Error in createLead:", error);
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
};

export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await leadService.updateLead(id, req.body, req.user.id);

    return res.status(200).json({
      status: "success",
      data: lead,
    });
  } catch (error) {
    console.error("Error in updateLead:", error);
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
};

export const getLeads = async (req, res) => {
  try {
    const leads = await leadService.getLeads(req.user.id, req.query);

    return res.status(200).json({
      status: "success",
      data: leads,
    });
  } catch (error) {
    console.error("Error in getLeads:", error);
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
};

export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await leadService.getLeadById(id, req.user.id);

    return res.status(200).json({
      status: "success",
      data: lead,
    });
  } catch (error) {
    console.error("Error in getLeadById:", error);
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
};
