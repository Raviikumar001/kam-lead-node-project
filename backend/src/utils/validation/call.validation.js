import { z } from "zod";
import { DateTime } from "luxon";

export const CallPlanningSchema = {
  todaysCalls: z.object({
    timezone: z.string().refine((timezone) => {
      try {
        return DateTime.local().setZone(timezone).isValid;
      } catch {
        return false;
      }
    }, "Invalid timezone"),
  }),

  updateCallSchedule: z.object({
    leadId: z.number().int().positive(),
    callCompletedTime: z.string().datetime(),
  }),

  businessHours: z.object({
    businessHoursStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    businessHoursEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    timezone: z.string(),
  }),

  updateCallFrequency: z
    .object({
      frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]),
      timezone: z.string().refine((timezone) => {
        try {
          return DateTime.local().setZone(timezone).isValid;
        } catch {
          return false;
        }
      }, "Invalid timezone"),
      businessHoursStart: z
        .string()
        .regex(
          /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Invalid time format. Use HH:mm"
        ),
      businessHoursEnd: z
        .string()
        .regex(
          /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Invalid time format. Use HH:mm"
        ),
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
    .refine((data) => {
      // Validate business hours
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
    }, "Business hours end must be after start time"),
};
