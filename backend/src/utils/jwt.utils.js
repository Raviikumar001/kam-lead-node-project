// src/utils/jwt.utils.js
import jwt from "jsonwebtoken";
import { APIError, ERROR_CODES } from "./error.utils.js";
import { logger } from "./logger.js";

const ACCESS_TOKEN_EXPIRES_IN = "24h"; // 24 hours access token
const REFRESH_TOKEN_EXPIRES_IN = "7d"; // 7 days refresh token

export const generateTokens = (payload) => {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Add tokenVersion to ensure token revocation capability
    const basePayload = {
      ...payload,
      tokenVersion: payload.tokenVersion || 0,
      iat: currentTimestamp,
    };

    // Generate access token
    const accessToken = jwt.sign(
      {
        ...basePayload,
        type: "access",
        // exp: currentTimestamp + 24 * 60 * 60, // 24 hours
      },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    // Generate refresh token with tokenVersion
    const refreshToken = jwt.sign(
      {
        ...basePayload,
        type: "refresh",
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    logger.debug("Tokens generated", {
      userId: payload.userId,
      tokenVersion: payload.tokenVersion,
      timestamp: new Date().toISOString(),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    };
  } catch (error) {
    logger.error("Token generation failed:", error);
    throw new APIError(
      "Failed to generate authentication tokens",
      500,
      ERROR_CODES.TOKEN_GENERATION_FAILED
    );
  }
};

export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "access") {
      throw new APIError("Invalid token type", 401, ERROR_CODES.INVALID_TOKEN);
    }

    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new APIError(
        "Access token has expired",
        401,
        ERROR_CODES.TOKEN_EXPIRED
      );
    }
    throw new APIError("Invalid access token", 401, ERROR_CODES.INVALID_TOKEN);
  }
};

export const verifyRefreshToken = async (token, userTokenVersion) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== "refresh") {
      throw new APIError("Invalid token type", 401, ERROR_CODES.INVALID_TOKEN);
    }

    // Verify token version matches user's current token version
    if (decoded.tokenVersion !== userTokenVersion) {
      throw new APIError(
        "Token has been revoked",
        401,
        ERROR_CODES.TOKEN_REVOKED
      );
    }

    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new APIError(
        "Refresh token has expired",
        401,
        ERROR_CODES.TOKEN_EXPIRED
      );
    }
    throw new APIError("Invalid refresh token", 401, ERROR_CODES.INVALID_TOKEN);
  }
};

export const refreshTokens = async (refreshToken, userTokenVersion) => {
  try {
    const decoded = await verifyRefreshToken(refreshToken, userTokenVersion);

    // Generate new tokens with the same token version
    return generateTokens({
      userId: decoded.userId,
      tokenVersion: decoded.tokenVersion,
    });
  } catch (error) {
    if (error instanceof APIError) throw error;

    throw new APIError(
      "Failed to refresh tokens",
      500,
      ERROR_CODES.TOKEN_REFRESH_FAILED
    );
  }
};
