// src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import { APIError } from "../utils/error.utils.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";

export const authMiddleware = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new APIError("No token provided", 401, "UNAUTHORIZED");
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Get user from database using correct Drizzle syntax
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      throw new APIError("User not found", 401, "UNAUTHORIZED");
    }

    // 4. Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    // 5. Add context data for the current time and user
    req.context = {
      currentTime: new Date(), // Captures exact time of the request
      currentUser: req.user.email, // Uses the authenticated user's email
    };
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      next(new APIError("Invalid token", 401, "UNAUTHORIZED"));
    } else {
      next(error);
    }
  }
};
