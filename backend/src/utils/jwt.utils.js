// src/utils/jwt.utils.js
import jwt from "jsonwebtoken";
import { APIError } from "./error.utils.js";
import { logger } from "./logger.js";

export const generateToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
  } catch (error) {
    logger.error("Token generation failed:", error);
    throw new APIError(
      "Failed to generate authentication token",
      500,
      "TOKEN_GENERATION_FAILED"
    );
  }
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new APIError("Token has expired", 401, "TOKEN_EXPIRED");
    }
    throw new APIError("Invalid token", 401, "INVALID_TOKEN");
  }
};
