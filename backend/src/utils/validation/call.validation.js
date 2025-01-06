// src/utils/validation/call.validation.js
import { z } from "zod";
import { DateTime } from "luxon";

// Common refinements
const timezoneRefinement = (timezone) => {
  try {
    return DateTime.local().setZone(timezone).isValid;
  } catch {
    return false;
  }
};

const timeFormatRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const CallPlanningSchema = {
  todaysCalls: z.object({
    timezone: z.string().refine(timezoneRefinement, {
      message: "Invalid timezone",
      path: ["timezone"],
    }),
  }),

  updateCallSchedule: z.object({
    leadId: z.number().int().positive("Lead ID must be a positive integer"),
    callCompletedTime: z
      .string()
      .datetime("Invalid datetime format. Use ISO 8601"),
    timezone: z.string().refine(timezoneRefinement, {
      message: "Invalid timezone",
      path: ["timezone"],
    }),
  }),

  businessHours: z.object({
    businessHoursStart: z
      .string()
      .regex(timeFormatRegex, "Invalid time format. Use HH:mm"),
    businessHoursEnd: z
      .string()
      .regex(timeFormatRegex, "Invalid time format. Use HH:mm"),
    timezone: z.string().refine(timezoneRefinement, {
      message: "Invalid timezone",
      path: ["timezone"],
    }),
  }),

  updateCallFrequency: z
    .object({
      frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"], {
        errorMap: () => ({ message: "Invalid frequency value" }),
      }),
      timezone: z.string().refine(timezoneRefinement, {
        message: "Invalid timezone",
        path: ["timezone"],
      }),
      businessHoursStart: z
        .string()
        .regex(timeFormatRegex, "Invalid time format. Use HH:mm"),
      businessHoursEnd: z
        .string()
        .regex(timeFormatRegex, "Invalid time format. Use HH:mm"),
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
        .min(1, "At least one preferred call day is required")
        .refine(
          (days) => new Set(days).size === days.length,
          "Duplicate days are not allowed"
        ),
    })
    .refine(
      (data) => {
        const [startHour, startMin] = data.businessHoursStart.split(":");
        const [endHour, endMin] = data.businessHoursEnd.split(":");

        const start = DateTime.fromObject({
          hour: parseInt(startHour),
          minute: parseInt(startMin),
        });

        const end = DateTime.fromObject({
          hour: parseInt(endHour),
          minute: parseInt(endMin),
        });

        return end > start;
      },
      {
        message: "Business hours end must be after start time",
        path: ["businessHours"],
      }
    ),
};
