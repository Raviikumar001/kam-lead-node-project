// src/middleware/call.middleware.js
import { CallPlanningSchema } from "../utils/validation/call.validation.js";
import { APIError, ERROR_CODES } from "../utils/error.utils.js";

const createContext = (req) => ({
  currentTime: new Date(),
  currentUser: req.user?.email || "system",
  userTimezone: req.query.timezone || "UTC",
});

const handleValidationError = (error, res) => {
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
      // Validate timezone
      await CallPlanningSchema.todaysCalls.parseAsync(req.query);

      // Set request context
      req.context = createContext(req);
      console.log("Today's calls context:", req.context);

      next();
    } catch (error) {
      handleValidationError(error, res);
    }
  },

  updateCallSchedule: async (req, res, next) => {
    try {
      const data = {
        leadId: parseInt(req.params.leadId),
        callCompletedTime: req.body.callCompletedTime,
        timezone: req.body.timezone || req.query.timezone,
      };

      // Validate request data
      await CallPlanningSchema.updateCallSchedule.parseAsync(data);

      // Set request context
      req.context = createContext(req);
      console.log("Update call schedule context:", {
        ...req.context,
        leadId: data.leadId,
      });

      next();
    } catch (error) {
      handleValidationError(error, res);
    }
  },

  updateCallFrequency: async (req, res, next) => {
    try {
      const leadId = parseInt(req.params.leadId);

      // Validate leadId
      if (!leadId || leadId <= 0) {
        throw new APIError(
          "Invalid lead ID",
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      // Validate request body
      await CallPlanningSchema.updateCallFrequency.parseAsync(req.body);

      // Validate business hours
      await CallPlanningSchema.businessHours.parseAsync({
        businessHoursStart: req.body.businessHoursStart,
        businessHoursEnd: req.body.businessHoursEnd,
        timezone: req.body.timezone,
      });

      // Set request context
      req.context = createContext(req);
      console.log("Update frequency context:", {
        ...req.context,
        leadId,
      });

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
