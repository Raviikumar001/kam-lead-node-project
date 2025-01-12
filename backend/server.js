// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, notFoundHandler } from "./src/utils/error.utils.js";
import routes from "./src/routes/index.js";
import { requestLoggerMiddleware } from "./src/utils/logger.js";
import { logger } from "./src/utils/logger.js";
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLoggerMiddleware);

// Routes
app.use("/api", routes);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
});
