// src/controllers/call-planning.controller.js
import { CallPlanningService } from "../services/call-planning.service";
import { ValidationError } from "../utils/errors";

export const CallPlanningController = {
  async getTodaysCalls(req, res) {
    try {
      const calls = await CallPlanningService.getTodaysCalls(
        req.query.timezone,
        req.context
      );

      return res.status(200).json({
        status: "success",
        data: calls,
        metadata: {
          timestamp: req.context.currentTime,
          user: req.context.currentUser,
        },
      });
    } catch (error) {
      return res.status(error instanceof ValidationError ? 400 : 500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  async updateCallSchedule(req, res) {
    try {
      const result = await CallPlanningService.updateCallSchedule(
        parseInt(req.params.leadId),
        new Date(req.body.callCompletedTime),
        req.context
      );

      return res.status(200).json({
        status: "success",
        data: result,
        metadata: {
          timestamp: req.context.currentTime,
          user: req.context.currentUser,
        },
      });
    } catch (error) {
      return res.status(error instanceof ValidationError ? 400 : 500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  async updateCallFrequency(req, res) {
    try {
      const { leadId } = req.params;
      const {
        frequency,
        timezone,
        businessHoursStart,
        businessHoursEnd,
        preferredCallDays,
      } = req.body;

      const result = await CallPlanningService.updateCallFrequency(
        parseInt(leadId),
        {
          frequency,
          timezone,
          businessHoursStart,
          businessHoursEnd,
          preferredCallDays,
        },
        req.context
      );

      return res.status(200).json({
        status: "success",
        data: result,
        metadata: {
          timestamp: req.context.currentTime, // 2025-01-06 03:41:08
          user: req.context.currentUser, // ravi-hisoka
        },
      });
    } catch (error) {
      return res.status(error instanceof ValidationError ? 400 : 500).json({
        status: "error",
        message: error.message,
      });
    }
  },
};

// export const CallPlanningController = {
//   async getTodaysCalls(req, res) {
//     try {
//       const context = {
//         currentTime: new Date(), // System will provide current time
//         currentUser: req.user.login, // System will provide current user
//       };

//       const { timezone = "UTC" } = req.query;
//       const calls = await CallPlanningService.getTodaysCalls(timezone, context);

//       return res.status(200).json({
//         status: "success",
//         data: calls,
//         metadata: {
//           timestamp: context.currentTime,
//           user: context.currentUser,
//         },
//       });
//     } catch (error) {
//       return res.status(error instanceof ValidationError ? 400 : 500).json({
//         status: "error",
//         message: error.message,
//       });
//     }
//   },

//   async updateCallSchedule(req, res) {
//     try {
//       const context = {
//         currentTime: new Date(), // System will provide current time
//         currentUser: req.user.login, // System will provide current user
//       };

//       const { leadId } = req.params;
//       const { callCompletedTime } = req.body;

//       const result = await CallPlanningService.updateCallSchedule(
//         parseInt(leadId),
//         new Date(callCompletedTime),
//         context
//       );

//       return res.status(200).json({
//         status: "success",
//         data: result,
//         metadata: {
//           timestamp: context.currentTime,
//           user: context.currentUser,
//         },
//       });
//     } catch (error) {
//       return res.status(error instanceof ValidationError ? 400 : 500).json({
//         status: "error",
//         message: error.message,
//       });
//     }
//   },
// };
