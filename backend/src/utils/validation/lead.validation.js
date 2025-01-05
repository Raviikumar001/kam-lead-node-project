// src/utils/validation/lead.validation.js
import { z } from "zod";

export const createLeadSchema = z.object({
  body: z.object({
    restaurantName: z.string().min(1, "Restaurant name is required"),
    address: z.string().min(1, "Address is required"),
    restaurantType: z.enum(["FINE_DINING", "CASUAL_DINING", "QSR"]),
    callFrequency: z.number().int().positive().optional(),
    notes: z.string().optional(),
  }),
});

export const updateLeadSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    restaurantName: z.string().optional(),
    address: z.string().optional(),
    status: z
      .enum([
        "NEW",
        "CONTACTED",
        "INTERESTED",
        "NEGOTIATING",
        "CONVERTED",
        "NOT_INTERESTED",
      ])
      .optional(),
    restaurantType: z.enum(["FINE_DINING", "CASUAL_DINING", "QSR"]).optional(),
    callFrequency: z.number().int().positive().optional(),
    notes: z.string().optional(),
  }),
});
