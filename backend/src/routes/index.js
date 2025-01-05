// src/routes/index.js
import express from "express";
import authRoutes from "./auth.routes.js";
// import projectRoutes from "./project.routes.js";
// import taskRoutes from "./task.routes.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.use("/auth", authRoutes);

// Protected routes
// router.use("/projects", authenticateToken, projectRoutes);
// router.use("/tasks", authenticateToken, taskRoutes);

export default router;
