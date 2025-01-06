import express from "express";
import { CallPlanningController } from "../controllers/call-planning.controller.js";
import { validateRequest } from "../middleware/call.middleware.js";

const router = express.Router();

router.get(
  "/today",
  validateRequest.todaysCalls,
  CallPlanningController.getTodaysCalls
);
router.post(
  "/lead/:leadId/update-call",
  validateRequest.updateCallSchedule,
  CallPlanningController.updateCallSchedule
);

router.patch(
  "/lead/:leadId/frequency",
  validateRequest.updateCallFrequency,
  CallPlanningController.updateCallFrequency
);

export default router;
