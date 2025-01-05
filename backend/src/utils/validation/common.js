// src/utils/validation/common.js
import { z } from "zod";

export const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.errors,
    });
  }
};
