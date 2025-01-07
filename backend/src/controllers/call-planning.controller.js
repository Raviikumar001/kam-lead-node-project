// src/controllers/call-planning.controller.js
import { CallPlanningService } from "../services/call-planning.service.js";

export const CallPlanningController = {
  async getTodaysCalls(req, res, next) {
    try {
      const context = req.context || {
        currentTime: new Date(),
        currentUser: req.user?.email || "system",
        userTimezone: req.query.timezone || "UTC",
      };

      const calls = await CallPlanningService.getTodaysCalls(
        req.query.timezone,
        context
      );

      res.json({
        status: "success",
        timestamp: new Date(),
        timezone: req.query.timezone,
        data: {
          total: calls.length,
          calls,
        },
      });
    } catch (error) {
      next(error);
    }
  },
  async updateCallSchedule(req, res, next) {
    try {
      const context = req.context;
      const result = await CallPlanningService.updateCallSchedule(
        parseInt(req.params.leadId),
        req.body.callCompletedTime,
        context
      );
      res.json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  },

  async updateCallFrequency(req, res, next) {
    try {
      const context = req.context;
      const result = await CallPlanningService.updateCallFrequency(
        parseInt(req.params.leadId),
        req.body,
        context
      );
      res.json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  },
};
