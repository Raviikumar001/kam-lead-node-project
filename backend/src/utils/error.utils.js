// src/utils/error.utils.js

import { logger } from "./logger.js";

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message,
    status = 500,
    code = "INTERNAL_SERVER_ERROR",
    errors = null
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;

    // Ensure proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  logger.error("Error occurred:", err);

  // If it's our custom API error, use its properties
  if (err instanceof APIError) {
    const errorResponse = {
      status: "error",
      code: err.code,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
      }),
    };
    return res.status(err.status).json(errorResponse);
  }

  // Handle Drizzle ORM errors
  if (err.code && err.code.startsWith("23")) {
    // PostgreSQL error codes
    const dbError = {
      status: "error",
      code: "DATABASE_ERROR",
      message: "Database operation failed",
      ...(process.env.NODE_ENV === "development" && {
        detail: err.detail,
        stack: err.stack,
      }),
    };
    return res.status(500).json(dbError);
  }

  // Default error response
  const defaultError = {
    status: "error",
    code: "INTERNAL_SERVER_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  };

  res.status(500).json(defaultError);
};

// 404 Not Found handler
export const notFoundHandler = (req, res, next) => {
  logger.warn(`Route not found: ${req.method} ${req.url}`);
  const err = new APIError(
    `Route ${req.method} ${req.url} not found`,
    404,
    "NOT_FOUND"
  );
  next(err);
};

// Async handler to remove try-catch boilerplate
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request validator middleware
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

// Example usage of error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  // Auth specific errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  // Resource specific errors
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS",
  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
};
