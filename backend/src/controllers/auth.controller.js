// src/controllers/auth.controller.js
import {
  registerUser,
  loginUser,
  revokeUserTokens,
} from "../services/auth.service.js";
import { logger } from "../utils/logger.js";
import { refreshTokens } from "../utils/jwt.utils.js";
import { APIError, ERROR_CODES } from "../utils/error.utils.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const formatResponse = (data, message = null) => ({
  status: "success",
  data,
  ...(message && { message }),
});

export const register = async (req, res) => {
  logger.info("Registration attempt", {
    email: req.body.email,
    timestamp: "2025-01-05 03:08:14",
  });

  const result = await registerUser(req.body);

  logger.success("User registered successfully", {
    userId: result.user.id,
    timestamp: "2025-01-05 03:08:14",
  });

  res.status(201).json(formatResponse(result, "Registration successful"));
};

export const login = async (req, res) => {
  logger.info("Login attempt", {
    email: req.body.email,
    timestamp: "2025-01-05 03:08:14",
  });

  const result = await loginUser(req.body.email, req.body.password);

  logger.success("User logged in successfully", {
    userId: result.user.id,
    timestamp: "2025-01-05 03:08:14",
  });

  res.status(200).json(formatResponse(result, "Login successful"));
};

export const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    logger.warn("Refresh token missing in request", {
      timestamp: "2025-01-05 03:08:14",
    });

    throw new APIError(
      "Refresh token is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const decoded = jwt.decode(refreshToken);

  if (!decoded || !decoded.userId) {
    logger.warn("Invalid refresh token format", {
      timestamp: "2025-01-05 03:08:14",
    });

    throw new APIError("Invalid refresh token", 400, ERROR_CODES.INVALID_TOKEN);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, decoded.userId))
    .limit(1);

  if (!user) {
    logger.warn("User not found during token refresh", {
      userId: decoded.userId,
      timestamp: "2025-01-05 03:08:14",
    });

    throw new APIError("User not found", 404, ERROR_CODES.USER_NOT_FOUND);
  }

  logger.info("Token refresh attempt", {
    userId: user.id,
    timestamp: "2025-01-05 03:08:14",
  });

  const tokens = await refreshTokens(refreshToken, user.tokenVersion);

  logger.success("Tokens refreshed successfully", {
    userId: user.id,
    timestamp: "2025-01-05 03:08:14",
  });

  res.json(formatResponse(tokens, "Tokens refreshed successfully"));
};

export const logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    try {
      const decoded = jwt.decode(refreshToken);

      if (decoded && decoded.userId) {
        await revokeUserTokens(decoded.userId);

        logger.info("User tokens revoked during logout", {
          userId: decoded.userId,
          timestamp: "2025-01-05 03:08:14",
        });
      }
    } catch (error) {
      logger.warn("Error during token revocation", {
        error: error.message,
        timestamp: "2025-01-05 03:08:14",
      });
    }
  }

  logger.success("User logged out successfully", {
    timestamp: "2025-01-05 03:08:14",
  });

  res.json(formatResponse(null, "Logged out successfully"));
};

export const logoutAll = async (req, res) => {
  const userId = req.user.id;

  await revokeUserTokens(userId);

  logger.success("User logged out from all devices", {
    userId,
    timestamp: "2025-01-05 03:08:14",
  });

  res.json(formatResponse(null, "Logged out from all devices successfully"));
};
