// src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import { APIError } from "../utils/error.utils.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new APIError("No token provided", 401, "UNAUTHORIZED");
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      throw new APIError("User not found", 401, "UNAUTHORIZED");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    req.context = {
      currentTime: new Date(),
      currentUser: req.user.email,
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
