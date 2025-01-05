// src/services/auth.service.js
import bcrypt from "bcrypt";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { APIError, ERROR_CODES } from "../utils/error.utils.js";
import { generateTokens } from "../utils/jwt.utils.js";
import { logger } from "../utils/logger.js";

export const registerUser = async (userData) => {
  const { email, password, name } = userData;

  logger.info("Attempting to register new user", {
    email,
    name,
    timestamp: "2025-01-05 05:06:20",
  });

  try {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      logger.warn("Registration failed - Email already exists", {
        email,
        timestamp: "2025-01-05 05:06:20",
      });
      throw new APIError(
        "User with this email already exists",
        409,
        ERROR_CODES.RESOURCE_ALREADY_EXISTS
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const now = new Date("2025-01-05 05:06:20");

    // Create user with all required fields
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        role: "user", // Default role
        tokenVersion: 0, // Initial token version
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        tokenVersion: users.tokenVersion,
      });

    // Generate both access and refresh tokens
    const tokens = generateTokens({
      userId: newUser.id,
      tokenVersion: newUser.tokenVersion, // Include token version
    });

    logger.success("User registered successfully", {
      userId: newUser.id,
      timestamp: "2025-01-05 05:06:20",
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      ...tokens, // This will spread accessToken, refreshToken, and expiresIn
    };
  } catch (error) {
    // If it's already an APIError, rethrow it
    if (error instanceof APIError) throw error;

    logger.error("Registration failed", {
      error: error.message,
      timestamp: "2025-01-05 05:06:20",
    });

    // Check for specific database errors
    if (error.code === "23505") {
      // PostgreSQL unique violation
      throw new APIError(
        "User with this email already exists",
        409,
        ERROR_CODES.RESOURCE_ALREADY_EXISTS
      );
    }

    throw new APIError(
      "Failed to register user",
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

// export const loginUser = async (email, password) => {
//   logger.info("Login attempt", { email });

//   try {
//     // Find user
//     const [user] = await db
//       .select()
//       .from(users)
//       .where(eq(users.email, email))
//       .limit(1);

//     if (!user) {
//       logger.warn("Login failed - User not found", { email });
//       throw new APIError(
//         "Invalid email or password", // Keep message vague for security
//         401,
//         ERROR_CODES.INVALID_CREDENTIALS
//       );
//     }

//     // Verify password
//     const isValidPassword = await bcrypt.compare(password, user.password);
//     if (!isValidPassword) {
//       logger.warn("Login failed - Invalid password", { email });
//       throw new APIError(
//         "Invalid email or password", // Keep message vague for security
//         401,
//         ERROR_CODES.INVALID_CREDENTIALS
//       );
//     }

//     const token = generateToken({ userId: user.id });

//     logger.success("User logged in successfully", { userId: user.id });

//     return {
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//       },
//       token,
//     };
//   } catch (error) {
//     if (error instanceof APIError) throw error;

//     logger.error("Login failed", error);
//     throw new APIError(
//       "Authentication failed",
//       500,
//       ERROR_CODES.INTERNAL_SERVER_ERROR,
//       error.message
//     );
//   }
// };
export const loginUser = async (email, password) => {
  logger.info("Login attempt", {
    email,
    timestamp: "2025-01-05 02:52:48",
  });

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      logger.warn("Login failed - User not found", { email });
      throw new APIError(
        "Invalid email or password",
        401,
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logger.warn("Login failed - Invalid password", { email });
      throw new APIError(
        "Invalid email or password",
        401,
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    // Generate tokens with tokenVersion
    const { accessToken, refreshToken, expiresIn } = generateTokens({
      userId: user.id,
      tokenVersion: user.tokenVersion, // Include user's token version
    });

    logger.success("User logged in successfully", {
      userId: user.id,
      timestamp: "2025-01-05 02:52:48",
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
      expiresIn,
    };
  } catch (error) {
    if (error instanceof APIError) throw error;

    logger.error("Login failed", error);
    throw new APIError(
      "Authentication failed",
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Add function to revoke all user tokens
export const revokeUserTokens = async (userId) => {
  try {
    await db
      .update(users)
      .set({
        tokenVersion: sql`${users.tokenVersion} + 1`,
      })
      .where(eq(users.id, userId));

    logger.info("User tokens revoked", {
      userId,
      timestamp: "2025-01-05 02:52:48",
    });
  } catch (error) {
    logger.error("Failed to revoke user tokens", error);
    throw new APIError(
      "Failed to revoke tokens",
      500,
      ERROR_CODES.TOKEN_REVOCATION_FAILED
    );
  }
};
