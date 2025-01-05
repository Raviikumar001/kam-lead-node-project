// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, notFoundHandler } from "./src/utils/error.utils.js";
import authRoutes from "./src/routes/auth.routes.js";
import { requestLoggerMiddleware } from "./src/utils/logger.js";
import { logger } from "./src/utils/logger.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLoggerMiddleware); // Log all requests

// Routes
app.use("/api/auth", authRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Handle 404 errors
app.use(notFoundHandler);

// Global error handler - should be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
  // In production, you might want to crash the process
  // process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  // In production, you should crash the process after cleanup
  // process.exit(1);
});
