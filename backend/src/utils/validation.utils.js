// src/utils/validation.utils.js
import { z } from "zod";
import { APIError } from "./error.utils.js";

export const validateRequest = (schema) => (req, res, next) => {
  try {
    req.validated = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new APIError(
        "Validation failed",
        400,
        "VALIDATION_ERROR",
        error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))
      );
    }
    next(error);
  }
};

// Authentication schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
