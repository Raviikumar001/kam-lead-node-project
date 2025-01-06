// src/routes/call-planning.routes.js
import express from "express";
import { CallPlanningController } from "../controllers/call-planning.controller";
import { validateRequest } from "../middleware/call.middleware";

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

export default router;
