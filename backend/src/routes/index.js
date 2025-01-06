// src/routes/index.js
import express from "express";
import authRoutes from "./auth.routes.js";
import performanceRoutes from "./performance.routes.js";
import interactionRoutes from "./interaction.routes.js";
import leadRoutes from "./lead.routes.js";
import contactRoutes from "./contact.routes.js";
import callPlanningRoutes from "./call-planning.routes.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.use("/auth", authRoutes);

// Protected routes with system context (2025-01-06 06:35:59 UTC, user: ravi-hisoka)
router.use("/performance", authMiddleware, performanceRoutes);
router.use("/interaction", authMiddleware, interactionRoutes);
router.use("/leads", authMiddleware, leadRoutes);
router.use("/contacts", authMiddleware, contactRoutes);
router.use("/call-planning", authMiddleware, callPlanningRoutes);

export default router;
