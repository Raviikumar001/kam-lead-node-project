// src/utils/validation/contact.validation.js
import { z } from "zod";

export const CONTACT_ROLES = [
  "OWNER",
  "MANAGER",
  "HEAD_CHEF",
  "CHEF",
  "PROCUREMENT_MANAGER",
  "ACCOUNTANT",
  "OTHER",
];

export const createContactSchema = z.object({
  body: z.object({
    leadId: z.number().int().positive("Lead ID is required"),
    name: z.string().min(1, "Contact name is required"),
    role: z.enum(CONTACT_ROLES, {
      errorMap: () => ({ message: "Invalid role" }),
    }),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional(),
    isPrimary: z.boolean().optional().default(false),
  }),
});

export const updateContactSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().optional(),
    role: z
      .enum(CONTACT_ROLES, {
        errorMap: () => ({ message: "Invalid role" }),
      })
      .optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional(),
    isPrimary: z.boolean().optional(),
  }),
});
