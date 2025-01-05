// src/utils/validation/interaction.validation.js
import { z } from "zod";

export const createInteractionSchema = z.object({
  body: z.object({
    leadId: z.number().int().positive("Lead ID is required"),
    contactId: z.number().int().positive("Contact ID is required"),
    type: z.enum(["CALL", "ORDER"], {
      errorMap: () => ({ message: "Invalid interaction type" }),
    }),
    status: z.enum(["COMPLETED", "NO_ANSWER", "FOLLOW_UP_NEEDED"], {
      errorMap: () => ({ message: "Invalid status" }),
    }),
    details: z.string().optional(),
    orderAmount: z.number().optional(),
    orderItems: z.object({}).optional(),
  }),
});
