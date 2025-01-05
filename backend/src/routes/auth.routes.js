// src/routes/auth.routes.js
import express from "express";
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
} from "../controllers/auth.controller.js";

import {
  validateRequest,
  loginSchema,
  registerSchema,
} from "../utils/validation/index.js";

import { asyncHandler } from "../utils/error.utils.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  asyncHandler(register)
);

router.post("/login", validateRequest(loginSchema), asyncHandler(login));

router.post("/refresh", asyncHandler(refresh));

router.post("/logout", asyncHandler(logout));

router.post(
  "/logout-all",
  authMiddleware, // Protected route
  asyncHandler(logoutAll)
);

export default router;
