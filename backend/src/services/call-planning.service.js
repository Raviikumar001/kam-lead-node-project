// src/services/call-planning.service.js
import { DateTime } from "luxon";
import { db } from "../db/index.js";
import { leads } from "../db/schema/index.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { APIError, ERROR_CODES } from "../utils/error.utils.js";

export const CallPlanningService = {
  async getTodaysCalls(timezone, context) {
    try {
      console.log("Processing getTodaysCalls request:", { timezone, context });

      if (!DateTime.local().setZone(timezone).isValid) {
        throw new APIError(
          `Invalid timezone: ${timezone}`,
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      const userDateTime = DateTime.fromJSDate(context.currentTime).setZone(
        timezone
      );

      const startOfDay = userDateTime.startOf("day");
      const endOfDay = userDateTime.endOf("day");

      console.log("Debug - Time Range:", {
        date: userDateTime.toFormat("yyyy-MM-dd"),
        startOfDay: startOfDay.toISO(),
        endOfDay: endOfDay.toISO(),
        startOfDayUTC: startOfDay.toUTC().toISO(),
        endOfDayUTC: endOfDay.toUTC().toISO(),
      });

      const startUtc = startOfDay.toUTC();
      const endUtc = endOfDay.toUTC();

      const calls = await db
        .select({
          id: leads.id,
          restaurantName: leads.restaurantName,
          status: leads.status,
          timezone: leads.timezone,
          callFrequency: leads.callFrequency,
          lastCallDate: leads.lastCallDate,
          nextCallDate: leads.nextCallDate,
          businessHoursStart: leads.businessHoursStart,
          businessHoursEnd: leads.businessHoursEnd,
          preferredCallDays: leads.preferredCallDays,
        })
        .from(leads)
        .where(
          and(
            sql`next_call_date IS NOT NULL`,

            gte(leads.nextCallDate, startUtc.toJSDate()),
            lte(leads.nextCallDate, endUtc.toJSDate())
          )
        )
        .orderBy(leads.nextCallDate);

      console.log(`Found ${calls.length} calls before filtering`);

      const validCalls = calls.map((call) => {
        const nextCallLocal = DateTime.fromJSDate(call.nextCallDate).setZone(
          call.timezone
        );

        const nextCallUser = nextCallLocal.setZone(timezone);

        return {
          id: call.id,
          restaurantName: call.restaurantName,
          status: call.status,
          callDetails: {
            frequency: call.callFrequency,
            lastCallDate: call.lastCallDate
              ? DateTime.fromJSDate(call.lastCallDate).toISO()
              : null,
            nextCallDate: nextCallLocal.toISO(),
            timezone: call.timezone,
            businessHours: {
              start: call.businessHoursStart.toString().slice(0, 5),
              end: call.businessHoursEnd.toString().slice(0, 5),
            },
            preferredCallDays: call.preferredCallDays,
            scheduledTime: {
              local: nextCallLocal.toFormat("yyyy-MM-dd HH:mm:ss"),
              user: nextCallUser.toFormat("yyyy-MM-dd HH:mm:ss"),
            },
          },
        };
      });

      console.log(`Returning ${validCalls.length} valid calls`);

      return {
        total: validCalls.length,
        calls: validCalls,
        timeRange: {
          date: userDateTime.toFormat("yyyy-MM-dd"),
          startTime: startOfDay.toFormat("HH:mm:ss"),
          endTime: endOfDay.toFormat("HH:mm:ss"),
          timezone: timezone,
        },
      };
    } catch (error) {
      console.error("Error in getTodaysCalls:", error);
      if (error instanceof APIError) throw error;
      throw new APIError(
        `Failed to get today's calls: ${error.message}`,
        500,
        ERROR_CODES.DATABASE_ERROR
      );
    }
  },

  async updateCallSchedule(leadId, callCompletedTime, context) {
    try {
      return await db.transaction(async (trx) => {
        const [lead] = await trx
          .select()
          .from(leads)
          .where(eq(leads.id, leadId));

        if (!lead) {
          throw new APIError(
            `Lead not found with ID: ${leadId}`,
            404,
            ERROR_CODES.RESOURCE_NOT_FOUND
          );
        }

        const completedDateTime = DateTime.fromISO(callCompletedTime).setZone(
          lead.timezone
        );

        if (!completedDateTime.isValid) {
          throw new APIError(
            "Invalid completion time",
            400,
            ERROR_CODES.VALIDATION_ERROR
          );
        }

        const nextCallDate = this.calculateNextCallDate(
          lead,
          completedDateTime
        );

        await trx
          .update(leads)
          .set({
            lastCallDate: completedDateTime.toJSDate(),
            nextCallDate: nextCallDate.toJSDate(),
            updatedAt: context.currentTime,
          })
          .where(eq(leads.id, leadId));

        return {
          leadId,
          lastCallDate: completedDateTime.toISO(),
          nextCallDate: nextCallDate.toISO(),
          localTime: nextCallDate
            .setZone(lead.timezone)
            .toFormat("yyyy-MM-dd HH:mm:ss"),
        };
      });
    } catch (error) {
      console.error("Error in updateCallSchedule:", error);
      if (error instanceof APIError) throw error;
      throw new APIError(
        `Failed to update call schedule: ${error.message}`,
        500,
        ERROR_CODES.DATABASE_ERROR
      );
    }
  },

  calculateNextCallDate(lead, fromTime) {
    if (!lead.callFrequency) {
      throw new APIError(
        "Call frequency not set for this lead. Please set call frequency first.",
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (!lead.businessHoursStart || !lead.businessHoursEnd) {
      throw new APIError(
        "Business hours not set for this lead. Please set business hours first.",
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (
      !Array.isArray(lead.preferredCallDays) ||
      lead.preferredCallDays.length === 0
    ) {
      throw new APIError(
        "Preferred call days not set for this lead. Please set preferred call days first.",
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    let nextCall = fromTime.setZone(lead.timezone);
    if (!nextCall.isValid) {
      throw new APIError(
        `Invalid timezone: ${lead.timezone}`,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const [startHour, startMinute] = lead.businessHoursStart
      .toString()
      .slice(0, 5)
      .split(":");
    const [endHour, endMinute] = lead.businessHoursEnd
      .toString()
      .slice(0, 5)
      .split(":");

    const businessStart = nextCall.set({
      hour: parseInt(startHour),
      minute: parseInt(startMinute),
    });

    if (nextCall.hour >= parseInt(endHour)) {
      nextCall = businessStart.plus({ days: 1 });
    } else if (nextCall.hour < parseInt(startHour)) {
      nextCall = businessStart;
    }

    switch (lead.callFrequency) {
      case "DAILY":
        if (nextCall.hour >= parseInt(endHour)) {
          nextCall = nextCall.plus({ days: 1 });
        }
        break;
      case "WEEKLY":
        nextCall = nextCall.plus({ weeks: 1 });
        break;
      case "BIWEEKLY":
        nextCall = nextCall.plus({ weeks: 2 });
        break;
      case "MONTHLY":
        nextCall = nextCall.plus({ months: 1 });
        break;
      default:
        throw new APIError(
          `Invalid frequency: ${lead.callFrequency}`,
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
    }

    let attempts = 0;
    const maxAttempts = 14;
    const preferredDays = lead.preferredCallDays.map((day) =>
      day.toUpperCase()
    );

    while (!preferredDays.includes(nextCall.weekdayLong.toUpperCase())) {
      nextCall = nextCall.plus({ days: 1 });
      attempts++;

      if (attempts >= maxAttempts) {
        throw new APIError(
          `Could not find suitable call time within ${maxAttempts} days`,
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    return nextCall;
  },

  async updateCallFrequency(leadId, callSettings, context) {
    try {
      return await db.transaction(async (trx) => {
        const [lead] = await trx
          .select()
          .from(leads)
          .where(eq(leads.id, leadId));

        if (!lead) {
          throw new APIError(
            `Lead not found with ID: ${leadId}`,
            404,
            ERROR_CODES.RESOURCE_NOT_FOUND
          );
        }

        const nextCallDate = this.calculateNextCallDate(
          {
            ...lead,
            ...callSettings,
          },
          DateTime.fromJSDate(context.currentTime)
        );

        const updatedLead = await trx
          .update(leads)
          .set({
            ...callSettings,
            nextCallDate: nextCallDate.toJSDate(),
            updatedAt: context.currentTime,
            updatedBy: context.currentUser,
          })
          .where(eq(leads.id, leadId))
          .returning();

        return {
          ...updatedLead[0],
          nextCallLocalTime: nextCallDate
            .setZone(callSettings.timezone)
            .toFormat("yyyy-MM-dd HH:mm:ss"),
        };
      });
    } catch (error) {
      console.error("Error in updateCallFrequency:", error);
      if (error instanceof APIError) throw error;
      throw new APIError(
        `Failed to update call frequency: ${error.message}`,
        500,
        ERROR_CODES.DATABASE_ERROR
      );
    }
  },
};
