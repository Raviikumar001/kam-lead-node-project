// src/routes/index.js
import express from "express";
import authRoutes from "./auth.routes.js";
// import projectRoutes from "./project.routes.js";
// import taskRoutes from "./task.routes.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.use("/auth", authRoutes);

// Protected routes
// router.use("/projects", authMiddleware, projectRoutes);
// router.use("/tasks", authMiddleware, taskRoutes);

export default router;
