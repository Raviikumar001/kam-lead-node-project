// src/utils/logger.js
import chalk from "chalk"; // First install: npm install chalk

// Format date to a readable string with timezone
const formatDate = () => {
  return new Date().toISOString();
};

// Sanitize data to prevent sensitive info logging
const sanitizeData = (data) => {
  if (!data) return data;

  const sensitiveFields = ["password", "token", "authorization", "cookie"];
  const sanitized = { ...data };

  Object.keys(sanitized).forEach((key) => {
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    }
    // Recursively sanitize nested objects
    else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });

  return sanitized;
};

export const logger = {
  info: (message, data = null) => {
    console.log(
      chalk.blue(`[INFO]`) + chalk.gray(` [${formatDate()}]`) + ` ${message}`,
      data ? chalk.gray(JSON.stringify(sanitizeData(data), null, 2)) : ""
    );
  },

  error: (message, error = null) => {
    console.error(
      chalk.red(`[ERROR]`) +
        chalk.gray(` [${formatDate()}]`) +
        chalk.red(` ${message}`)
    );

    if (error) {
      if (error instanceof Error) {
        console.error(chalk.red("Error Details:"), {
          message: error.message,
          ...(error.code && { code: error.code }),
          ...(error.stack && { stack: error.stack }),
        });
      } else {
        console.error(chalk.red("Error Details:"), sanitizeData(error));
      }
    }
  },

  success: (message, data = null) => {
    console.log(
      chalk.green(`[SUCCESS]`) +
        chalk.gray(` [${formatDate()}]`) +
        ` ${message}`,
      data ? chalk.gray(JSON.stringify(sanitizeData(data), null, 2)) : ""
    );
  },

  warn: (message, data = null) => {
    console.warn(
      chalk.yellow(`[WARN]`) + chalk.gray(` [${formatDate()}]`) + ` ${message}`,
      data ? chalk.gray(JSON.stringify(sanitizeData(data), null, 2)) : ""
    );
  },

  debug: (message, data = null) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        chalk.magenta(`[DEBUG]`) +
          chalk.gray(` [${formatDate()}]`) +
          ` ${message}`,
        data ? chalk.gray(JSON.stringify(sanitizeData(data), null, 2)) : ""
      );
    }
  },

  // HTTP request logger
  request: (req) => {
    const logData = {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
      headers: {
        "user-agent": req.headers["user-agent"],
        "content-type": req.headers["content-type"],
        // Add other relevant headers
      },
      ip: req.ip,
    };

    logger.info(`${req.method} ${req.url}`, sanitizeData(logData));
  },

  // HTTP response logger
  response: (req, res, responseTime) => {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      logger.error(`${req.method} ${req.url} ${res.statusCode}`, logData);
    } else {
      logger.info(`${req.method} ${req.url} ${res.statusCode}`, logData);
    }
  },

  // Transaction logger for database operations
  transaction: (operation, details) => {
    logger.debug(`DB Transaction: ${operation}`, sanitizeData(details));
  },
};

// Middleware to log requests
export const requestLoggerMiddleware = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.request(req);

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.response(req, res, duration);
  });

  next();
};

// If you want to log to a file as well, you can add this:
// Note: For production, consider using a proper logging service
if (process.env.NODE_ENV === "production") {
  const fs = require("fs");
  const util = require("util");
  const logFile = fs.createWriteStream("app.log", { flags: "a" });

  // Override console.log and console.error
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  console.log = function () {
    logFile.write(util.format.apply(null, arguments) + "\n");
    originalConsoleLog.apply(console, arguments);
  };

  console.error = function () {
    logFile.write(util.format.apply(null, arguments) + "\n");
    originalConsoleError.apply(console, arguments);
  };
}
