// middleware/performance.middleware.js
import { performanceValidation } from "../utils/validation/performance.validation.js";

export const performanceMiddleware = {
  validateLeadId: async (req, res, next) => {
    try {
      await performanceValidation.leadId.parseAsync({
        leadId: Number(req.params.leadId),
      });
      next();
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: "Invalid Lead ID",
        errors: error.errors,
      });
    }
  },

  validatePerformanceQuery: async (req, res, next) => {
    try {
      const validated =
        await performanceValidation.getPerformanceMetrics.parseAsync(req.query);
      req.validatedQuery = validated;
      next();
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: "Invalid query parameters",
        errors: error.errors,
      });
    }
  },

  validateOrderHistory: async (req, res, next) => {
    try {
      const validated =
        await performanceValidation.updateOrderHistory.parseAsync({
          ...req.body,
          orderDate: new Date(req.body.orderDate),
        });
      req.validatedBody = validated;
      next();
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: "Invalid order data",
        errors: error.errors,
      });
    }
  },
};
