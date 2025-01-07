// src/middleware/call.middleware.js
import { CallPlanningSchema } from "../utils/validation/call.validation.js";
import { APIError, ERROR_CODES } from "../utils/error.utils.js";

const createContext = (req) => ({
  currentTime: new Date(),
  currentUser: req.user?.email || "system",
  userTimezone: req.query.timezone || "UTC",
});

const handleValidationError = (error, req, res) => {
  const errorMessage = error.errors?.[0]?.message || "Validation failed";

  return res.status(400).json({
    status: "error",
    code: ERROR_CODES.VALIDATION_ERROR,
    message: errorMessage,
    timestamp: new Date(),
    user: req.user?.email,
  });
};

export const validateRequest = {
  todaysCalls: async (req, res, next) => {
    try {
      await CallPlanningSchema.todaysCalls.parseAsync(req.query);

      req.context = createContext(req);

      next();
    } catch (error) {
      handleValidationError(error, req, res);
    }
  },

  updateCallSchedule: async (req, res, next) => {
    try {
      const data = {
        leadId: parseInt(req.params.leadId),
        callCompletedTime: req.body.callCompletedTime,
        timezone: req.body.timezone || req.query.timezone,
      };

      await CallPlanningSchema.updateCallSchedule.parseAsync(data);

      req.context = createContext(req);

      next();
    } catch (error) {
      handleValidationError(error, res);
    }
  },

  updateCallFrequency: async (req, res, next) => {
    try {
      const leadId = parseInt(req.params.leadId);

      if (!leadId || leadId <= 0) {
        throw new APIError(
          "Invalid lead ID",
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      await CallPlanningSchema.updateCallFrequency.parseAsync(req.body);

      await CallPlanningSchema.businessHours.parseAsync({
        businessHoursStart: req.body.businessHoursStart,
        businessHoursEnd: req.body.businessHoursEnd,
        timezone: req.body.timezone,
      });

      req.context = createContext(req);

      next();
    } catch (error) {
      if (error instanceof APIError) {
        return res.status(error.statusCode).json({
          status: "error",
          code: error.code,
          message: error.message,
          timestamp: new Date(),
          user: req.user?.email,
        });
      }
      handleValidationError(error, res);
    }
  },
};
