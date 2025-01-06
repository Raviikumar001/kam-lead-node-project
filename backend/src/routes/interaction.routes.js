// src/routes/interaction.routes.js
import express from "express";
import {
  createInteractionHandler,
  getInteractionsByLeadHandler,
  getLastInteractionHandler,
  getLeadInteractionStatsHandler,
} from "../controllers/interaction.controller.js";
import { validateRequest } from "../utils/validation/index.js";
import { createInteractionSchema } from "../utils/validation/interaction.validation.js";

const router = express.Router();

router.post(
  "/",
  validateRequest(createInteractionSchema),
  createInteractionHandler
);
router.get("/lead/:leadId", getInteractionsByLeadHandler);
router.get("/lead/:leadId/stats", getLeadInteractionStatsHandler);

router.get("/lead/:leadId/last", getLastInteractionHandler);

export default router;
