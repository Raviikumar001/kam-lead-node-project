// src/utils/validation/lead.validation.js
import { z } from "zod";

const CallFrequencyEnum = z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]);
const LeadStatusEnum = z.enum([
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "NEGOTIATING",
  "CONVERTED",
  "NOT_INTERESTED",
]);
const RestaurantTypeEnum = z.enum(["FINE_DINING", "CASUAL_DINING", "QSR"]);

export const createLeadSchema = z.object({
  body: z.object({
    restaurantName: z.string().min(1, "Restaurant name is required"),
    address: z.string().min(1, "Address is required"),
    status: LeadStatusEnum.default("NEW"),
    restaurantType: RestaurantTypeEnum.optional(),
    notes: z.string().optional(),
    timezone: z.string().default("UTC"),
    businessHoursStart: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    businessHoursEnd: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    callFrequency: CallFrequencyEnum.optional(), // Changed from number to enum
    preferredCallDays: z
      .array(
        z.enum([
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
          "SUNDAY",
        ])
      )
      .optional(),
  }),
});

export const updateLeadSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    restaurantName: z.string().optional(),
    address: z.string().optional(),
    status: LeadStatusEnum.optional(),
    restaurantType: RestaurantTypeEnum.optional(),
    callFrequency: CallFrequencyEnum.optional(),
    notes: z.string().optional(),
  }),
});
