// src/utils/logger.js
import chalk from "chalk";
import { createWriteStream } from "fs";
import { format } from "util";

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
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });

  return sanitized;
};

let logFile;
if (process.env.NODE_ENV === "production") {
  logFile = createWriteStream("app.log", { flags: "a" });
}

const writeToFile = (message) => {
  if (process.env.NODE_ENV === "production" && logFile) {
    logFile.write(message + "\n");
  }
};

export const logger = {
  info: (message, data = null) => {
    const logMessage = `${chalk.blue(`[INFO]`)}${chalk.gray(
      ` [${formatDate()}]`
    )} ${message}${
      data ? chalk.gray(JSON.stringify(sanitizeData(data), null, 2)) : ""
    }`;

    writeToFile(format(logMessage));
  },

  error: (message, error = null) => {
    const logMessage = `${chalk.red(`[ERROR]`)}${chalk.gray(
      ` [${formatDate()}]`
    )}${chalk.red(` ${message}`)}`;
    console.error(logMessage);

    if (error) {
      const errorDetails =
        error instanceof Error
          ? {
              message: error.message,
              ...(error.code && { code: error.code }),
              ...(error.stack && { stack: error.stack }),
            }
          : sanitizeData(error);

      console.error(chalk.red("Error Details:"), errorDetails);
      writeToFile(format(logMessage, errorDetails));
    } else {
      writeToFile(format(logMessage));
    }
  },

  success: (message, data = null) => {
    const logMessage = `${chalk.green(`[SUCCESS]`)}${chalk.gray(
      ` [${formatDate()}]`
    )} ${message}${
      data ? chalk.gray(JSON.stringify(sanitizeData(data), null, 2)) : ""
    }`;

    writeToFile(format(logMessage));
  },

  warn: (message, data = null) => {
    const logMessage = `${chalk.yellow(`[WARN]`)}${chalk.gray(
      ` [${formatDate()}]`
    )} ${message}${
      data ? chalk.gray(JSON.stringify(sanitizeData(data), null, 2)) : ""
    }`;
    console.warn(logMessage);
    writeToFile(format(logMessage));
  },

  debug: (message, data = null) => {
    if (process.env.NODE_ENV === "development") {
      const logMessage = `${chalk.magenta(`[DEBUG]`)}${chalk.gray(
        ` [${formatDate()}]`
      )} ${message}${
        data ? chalk.gray(JSON.stringify(sanitizeData(data), null, 2)) : ""
      }`;

      writeToFile(format(logMessage));
    }
  },

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
      },
      ip: req.ip,
    };

    logger.info(`${req.method} ${req.url}`, sanitizeData(logData));
  },

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

  transaction: (operation, details) => {
    logger.debug(`DB Transaction: ${operation}`, sanitizeData(details));
  },
};

export const requestLoggerMiddleware = (req, res, next) => {
  const start = Date.now();
  logger.request(req);

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.response(req, res, duration);
  });

  next();
};
