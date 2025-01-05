// src/middleware/auth.middleware.js
import { verifyAccessToken } from "../utils/jwt.utils.js";
import { APIError, ERROR_CODES } from "../utils/error.utils.js";
import { logger } from "../utils/logger.js";

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      throw new APIError("No token provided", 401, ERROR_CODES.UNAUTHORIZED);
    }

    const decoded = verifyAccessToken(token);

    // Add user info to request object
    req.user = {
      userId: decoded.userId,
      login: decoded.login,
      role: decoded.role,
    };

    logger.debug("Token authenticated", {
      login: decoded.login,
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    });

    next();
  } catch (error) {
    next(error);
  }
};
