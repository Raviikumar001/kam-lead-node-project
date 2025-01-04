// src/controllers/auth.controller.js
import { AuthService } from "../services/auth.service.js";

export class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  register = async (req, res, next) => {
    try {
      const userData = req.body;
      const result = await this.authService.registerUser(userData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.loginUser(email, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
