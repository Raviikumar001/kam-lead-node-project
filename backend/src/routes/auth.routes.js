// src/routes/auth.routes.js
import express from "express";
import { AuthController } from "../controllers/auth.controller.js";

const router = express.Router();
const authController = new AuthController();

router.post("/register", authController.register);
router.post("/login", authController.login);

export default router;
