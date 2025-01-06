// controllers/performance.controller.js
import { PerformanceService } from "../services/performance.service.js";
import { performanceValidation } from "../utils/validation/performance.validation.js";
import { APIError } from "../utils/error.utils.js";

export const PerformanceController = {
  async getLeadPerformance(req, res, next) {
    try {
      const { leadId } = req.params;

      if (!leadId) {
        throw new APIError({
          message: "Lead ID is required",
          statusCode: 400,
        });
      }

      await performanceValidation.leadId
        .parseAsync({ leadId: Number(leadId) })
        .catch(() => {
          throw new APIError({
            message: "Invalid Lead ID format",
            statusCode: 400,
          });
        });

      const performance = await PerformanceService.getLeadPerformance(
        Number(leadId),
        req.context
      );

      res.json({
        status: "success",
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  },

  async getLeadsByPerformance(req, res, next) {
    try {
      const params = await performanceValidation.getPerformanceMetrics
        .parseAsync(req.query)
        .catch((validationError) => {
          throw new APIError({
            message: "Invalid query parameters",
            statusCode: 400,
            cause: validationError,
          });
        });

      const leads = await PerformanceService.getLeadsByPerformance(
        params,
        req.context
      );

      if (!leads || leads.length === 0) {
        throw new APIError({
          message: "No leads found with specified criteria",
          statusCode: 404,
        });
      }

      res.json({
        status: "success",
        data: leads,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateOrderHistory(req, res, next) {
    try {
      if (!req.body) {
        throw new APIError({
          message: "Request body is required",
          statusCode: 400,
        });
      }

      const orderData = await performanceValidation.updateOrderHistory
        .parseAsync(req.body)
        .catch((validationError) => {
          throw new APIError({
            message: "Invalid order data",
            statusCode: 400,
            cause: validationError,
          });
        });

      if (orderData.orderDate > req.context.currentTime) {
        throw new APIError({
          message: "Order date cannot be in the future",
          statusCode: 400,
        });
      }

      const performance = await PerformanceService.updateOrderHistory(
        orderData,
        req.context
      );

      res.json({
        status: "success",
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  },
};
