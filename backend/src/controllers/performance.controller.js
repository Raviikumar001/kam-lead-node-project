// controllers/performance.controller.js
import { PerformanceService } from "../services/performance.service.js";
import { performanceValidation } from "../utils/validation/performance.validation.js";
import { APIError } from "../utils/error.utils.js";

export const PerformanceController = {
  async getLeadPerformance(req, res, next) {
    try {
      const leadId = Number(req.params.leadId);

      const performance = await PerformanceService.getLeadPerformance(
        leadId,
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
        throw new APIError(
          "Request body is required",
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      const orderData =
        await performanceValidation.updateOrderHistory.parseAsync({
          ...req.body,
          orderDate: new Date(req.body.orderDate),
        });

      const orderTimestamp = new Date(orderData.orderDate).getTime();
      const currentTimestamp = new Date(req.context.currentTime).getTime();

      if (orderTimestamp > currentTimestamp) {
        throw new APIError(
          "Order date cannot be in the future",
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
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
      console.error("Error in updateOrderHistory:", error);
      if (error.name === "ZodError") {
        return next(
          new APIError(
            "Invalid order data",
            400,
            ERROR_CODES.VALIDATION_ERROR,
            error.errors
          )
        );
      }
      next(error);
    }
  },
};
