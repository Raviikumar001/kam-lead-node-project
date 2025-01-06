// src/controllers/interaction.controller.js
import {
  createInteraction,
  getInteractionsByLead,
  getLastInteractionForLead,
  getLeadInteractionStats,
} from "../services/interaction.service.js";
import { errorHandler } from "../utils/error.utils.js";

export const createInteractionHandler = async (req, res) => {
  try {
    const interaction = await createInteraction(req.body, req.user.id);

    return res.status(201).json({
      status: "success",
      data: interaction,
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

export const getInteractionsByLeadHandler = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const filters = {
      type: req.query.type,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    // Validate leadId
    if (!leadId || isNaN(parseInt(leadId))) {
      throw new APIError("Invalid lead ID", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const interactions = await getInteractionsByLead(parseInt(leadId), filters);

    res.json({
      status: "success",
      data: interactions,
    });
  } catch (error) {
    next(error);
  }
};

export const getLastInteractionHandler = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    // Validate leadId
    if (!leadId || isNaN(parseInt(leadId))) {
      throw new APIError("Invalid lead ID", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const interaction = await getLastInteractionForLead(parseInt(leadId));

    if (!interaction) {
      return res.json({
        status: "success",
        data: null,
        message: "No interactions found for this lead",
      });
    }

    res.json({
      status: "success",
      data: interaction,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadInteractionStatsHandler = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    // Validate leadId
    if (!leadId || isNaN(parseInt(leadId))) {
      throw new APIError("Invalid lead ID", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const stats = await getLeadInteractionStats(parseInt(leadId));

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
