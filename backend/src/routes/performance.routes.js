// routes/performance.routes.js
import { Router } from "express";
import { PerformanceController } from "../controllers/performance.controller.js";
import { performanceMiddleware } from "../middleware/performance.middleware.js";

const router = Router();

// Get performance metrics for a specific lead
router.get(
  "/leads/:leadId/performance",
  performanceMiddleware.validateLeadId,
  PerformanceController.getLeadPerformance
);

// Get leads filtered by performance status
router.get(
  "/leads/performance",
  performanceMiddleware.validatePerformanceQuery,
  PerformanceController.getLeadsByPerformance
);

// Update order history and recalculate performance
router.post(
  "/leads/performance/orders",
  performanceMiddleware.validateOrderHistory,
  PerformanceController.updateOrderHistory
);

export default router;
