// src/controllers/interaction.controller.js
import {
  createInteraction,
  getInteractionsByLead,
  getInteractionById,
  getLastInteractionForLead,
  getLeadInteractionStats,
} from "../services/interaction.service.js";
import { errorHandler } from "../utils/error.util.js";

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

export const getInteractionsByLeadHandler = async (req, res) => {
  try {
    const { leadId } = req.params;
    const interactions = await getInteractionsByLead(leadId, req.query);

    return res.status(200).json({
      status: "success",
      data: interactions,
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

export const getLeadInteractionStatsHandler = async (req, res) => {
  try {
    const { leadId } = req.params;
    const stats = await getLeadInteractionStats(leadId);

    return res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

export const getLastInteractionHandler = async (req, res) => {
  try {
    const { leadId } = req.params;
    const lastInteraction = await getLastInteractionForLead(leadId);

    return res.status(200).json({
      status: "success",
      data: lastInteraction,
      metadata: {
        timestamp: "2025-01-05 18:02:43", // Using current system time
        user: "ravi-hisoka", // Using current user
      },
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};
