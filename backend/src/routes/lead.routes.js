// src/routes/lead.routes.js
import express from "express";
import {
  createLead,
  updateLead,
  getLeads,
  getLeadById,
} from "../controllers/lead.controller.js";
import {
  validateRequest,
  createLeadSchema,
  updateLeadSchema,
} from "../utils/validation/index.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes are protected by auth middleware
router.use(authMiddleware);

router.post("/", validateRequest(createLeadSchema), createLead);
router.patch("/:id", validateRequest(updateLeadSchema), updateLead);
router.get("/", getLeads);
router.get("/:id", getLeadById);

export default router;
