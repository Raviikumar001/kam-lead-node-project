// src/controllers/call-planning.controller.js
import { CallPlanningService } from "../services/call-planning.service.js";

export const CallPlanningController = {
  async getTodaysCalls(req, res, next) {
    try {
      // Use the context set by middleware
      const context = req.context || {
        currentTime: new Date(),
        currentUser: req.user?.email || "system",
        userTimezone: req.query.timezone || "UTC",
      };

      console.log("Processing getTodaysCalls request:", {
        timezone: req.query.timezone,
        context,
      });

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

// // src/controllers/call-planning.controller.js
// import { CallPlanningService } from "../services/call-planning.service.js";
// import { APIError, ERROR_CODES } from "../utils/error.utils.js";
// import { asyncHandler } from "../utils/error.utils.js";

// export const CallPlanningController = {
//   getTodaysCalls: asyncHandler(async (req, res) => {
//     const { timezone } = req.query;

//     if (!timezone) {
//       throw new APIError(
//         "Timezone is required",
//         400,
//         ERROR_CODES.VALIDATION_ERROR
//       );
//     }

//     const calls = await CallPlanningService.getTodaysCalls(
//       timezone,
//       req.context
//     );

//     return res.status(200).json({
//       status: "success",
//       data: calls,
//       metadata: {
//         timestamp: req.context.currentTime,
//         user: req.context.currentUser,
//       },
//     });
//   }),

//   updateCallSchedule: asyncHandler(async (req, res) => {
//     const leadId = parseInt(req.params.leadId);
//     const { callCompletedTime } = req.body;

//     if (!leadId || isNaN(leadId)) {
//       throw new APIError("Invalid lead ID", 400, ERROR_CODES.VALIDATION_ERROR);
//     }

//     if (!callCompletedTime) {
//       throw new APIError(
//         "Call completion time is required",
//         400,
//         ERROR_CODES.VALIDATION_ERROR
//       );
//     }

//     const completionDate = new Date(callCompletedTime);
//     if (isNaN(completionDate.getTime())) {
//       throw new APIError(
//         "Invalid call completion time format",
//         400,
//         ERROR_CODES.VALIDATION_ERROR
//       );
//     }

//     const result = await CallPlanningService.updateCallSchedule(
//       leadId,
//       completionDate,
//       req.context
//     );

//     return res.status(200).json({
//       status: "success",
//       data: result,
//       metadata: {
//         timestamp: req.context.currentTime,
//         user: req.context.currentUser,
//       },
//     });
//   }),

//   updateCallFrequency: asyncHandler(async (req, res) => {
//     const leadId = parseInt(req.params.leadId);
//     const {
//       frequency,
//       timezone,
//       businessHoursStart,
//       businessHoursEnd,
//       preferredCallDays,
//     } = req.body;

//     // Validate leadId
//     if (!leadId || isNaN(leadId)) {
//       throw new APIError("Invalid lead ID", 400, ERROR_CODES.VALIDATION_ERROR);
//     }

//     // Validate required fields
//     if (!frequency) {
//       throw new APIError(
//         "Call frequency is required",
//         400,
//         ERROR_CODES.VALIDATION_ERROR
//       );
//     }

//     if (!timezone) {
//       throw new APIError(
//         "Timezone is required",
//         400,
//         ERROR_CODES.VALIDATION_ERROR
//       );
//     }

//     // Validate business hours
//     if (businessHoursStart && businessHoursEnd) {
//       const startTime = parseInt(businessHoursStart);
//       const endTime = parseInt(businessHoursEnd);

//       if (isNaN(startTime) || startTime < 0 || startTime > 23) {
//         throw new APIError(
//           "Invalid business hours start time. Must be between 0-23",
//           400,
//           ERROR_CODES.VALIDATION_ERROR
//         );
//       }

//       if (isNaN(endTime) || endTime < 0 || endTime > 23) {
//         throw new APIError(
//           "Invalid business hours end time. Must be between 0-23",
//           400,
//           ERROR_CODES.VALIDATION_ERROR
//         );
//       }

//       if (startTime >= endTime) {
//         throw new APIError(
//           "Business hours end time must be after start time",
//           400,
//           ERROR_CODES.VALIDATION_ERROR
//         );
//       }
//     }

//     // Validate preferredCallDays if provided
//     if (preferredCallDays && !Array.isArray(preferredCallDays)) {
//       throw new APIError(
//         "Preferred call days must be an array",
//         400,
//         ERROR_CODES.VALIDATION_ERROR
//       );
//     }

//     const result = await CallPlanningService.updateCallFrequency(
//       leadId,
//       {
//         frequency,
//         timezone,
//         businessHoursStart,
//         businessHoursEnd,
//         preferredCallDays,
//       },
//       req.context
//     );

//     return res.status(200).json({
//       status: "success",
//       data: result,
//       metadata: {
//         timestamp: req.context.currentTime,
//         user: req.context.currentUser,
//       },
//     });
//   }),
// };
