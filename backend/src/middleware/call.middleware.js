// src/middleware/call.middleware.js
import { CallPlanningSchema } from "../utils/validation/call.validation.js";

export const validateRequest = {
  todaysCalls: async (req, res, next) => {
    try {
      await CallPlanningSchema.todaysCalls.parseAsync(req.query);
      req.context = {
        currentTime: new Date(),
        currentUser: req.user?.login,
      };
      next();
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: error.errors,
      });
    }
  },

  updateCallSchedule: async (req, res, next) => {
    try {
      const data = {
        leadId: parseInt(req.params.leadId),
        callCompletedTime: req.body.callCompletedTime,
      };
      await CallPlanningSchema.updateCallSchedule.parseAsync(data);
      req.context = {
        currentTime: new Date(),
        currentUser: req.user?.login,
      };
      next();
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: error.errors,
      });
    }
  },

  updateCallFrequency: async (req, res, next) => {
    try {
      const { leadId } = req.params;

      // Validate leadId
      if (!leadId || isNaN(parseInt(leadId)) || parseInt(leadId) <= 0) {
        throw new ValidationError("Invalid lead ID");
      }

      // Validate request body
      await CallPlanningSchema.updateCallFrequency.parseAsync(req.body);

      // Add system context
      req.context = {
        currentTime: new Date(), // System provided
        currentUser: req.user?.login, // System provided
      };

      next();
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message:
          error instanceof ValidationError
            ? error.message
            : error.errors?.[0]?.message || "Validation failed",
        timestamp: new Date(),
        user: req.user?.login,
      });
    }
  },
};
