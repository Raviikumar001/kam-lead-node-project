// src/services/call-planning.service.js
import { DateTime } from "luxon";
import { db } from "../db/index.js";
import { leads } from "../db/schema/index.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { APIError, ERROR_CODES } from "../utils/error.utils.js";

export const CallPlanningService = {
  async getTodaysCalls(
    userTimezone,
    context = {
      currentTime: new Date("2025-01-06T04:15:26Z"),
      currentUser: "ravi-hisoka",
    }
  ) {
    try {
      const userDateTime = DateTime.fromJSDate(context.currentTime).setZone(
        userTimezone
      );

      if (!userDateTime.isValid) {
        throw new APIError(
          `Invalid timezone: ${userTimezone}`,
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      const startOfDay = userDateTime.startOf("day");
      const endOfDay = userDateTime.endOf("day");

      const calls = await db
        .select({
          id: leads.id,
          name: leads.name,
          timezone: leads.timezone,
          nextCallDate: leads.nextCallDate,
          businessHoursStart: leads.businessHoursStart,
          businessHoursEnd: leads.businessHoursEnd,
          frequency: leads.frequency,
          preferredCallDays: leads.preferredCallDays,
        })
        .from(leads)
        .where(
          and(
            gte(leads.nextCallDate, startOfDay.toJSDate()),
            lte(leads.nextCallDate, endOfDay.toJSDate())
          )
        );

      const validCalls = calls.filter((call) => {
        const callDateTime = DateTime.fromJSDate(call.nextCallDate).setZone(
          call.timezone
        );

        const [startHour, startMinute] = call.businessHoursStart.split(":");
        const [endHour, endMinute] = call.businessHoursEnd.split(":");

        const businessStart = callDateTime.set({
          hour: parseInt(startHour),
          minute: parseInt(startMinute),
        });

        let businessEnd = callDateTime.set({
          hour: parseInt(endHour),
          minute: parseInt(endMinute),
        });

        if (businessEnd < businessStart) {
          businessEnd = businessEnd.plus({ days: 1 });
        }

        return callDateTime >= businessStart && callDateTime <= businessEnd;
      });

      return validCalls;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        `Failed to fetch today's calls: ${error.message}`,
        500,
        ERROR_CODES.DATABASE_ERROR
      );
    }
  },

  async updateCallSchedule(
    leadId,
    callCompletedTime,
    context = {
      currentTime: new Date("2025-01-06T04:15:26Z"),
      currentUser: "ravi-hisoka",
    }
  ) {
    try {
      return await db.transaction(async (trx) => {
        const lead = await trx
          .select()
          .from(leads)
          .where(eq(leads.id, leadId))
          .limit(1);

        if (!lead.length) {
          throw new APIError(
            `Lead not found with ID: ${leadId}`,
            404,
            ERROR_CODES.RESOURCE_NOT_FOUND
          );
        }

        const nextCallDate = this.calculateNextCallDate(
          lead[0],
          DateTime.fromJSDate(context.currentTime)
        );

        await trx
          .update(leads)
          .set({
            lastCallDate: callCompletedTime,
            nextCallDate: nextCallDate.toJSDate(),
            updatedAt: context.currentTime,
            updatedBy: context.currentUser,
          })
          .where(eq(leads.id, leadId));

        return {
          nextCallDate: nextCallDate.toJSDate(),
          localTime: nextCallDate
            .setZone(lead[0].timezone)
            .toFormat("yyyy-MM-dd HH:mm:ss"),
        };
      });
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        `Failed to update call schedule: ${error.message}`,
        500,
        ERROR_CODES.DATABASE_ERROR
      );
    }
  },

  calculateNextCallDate(lead, currentTime) {
    let nextCall = currentTime.setZone(lead.timezone);

    if (!nextCall.isValid) {
      throw new APIError(
        `Invalid timezone: ${lead.timezone}`,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const [startHour, startMinute] = lead.businessHoursStart.split(":");
    const [endHour, endMinute] = lead.businessHoursEnd.split(":");

    let businessStart = nextCall.set({
      hour: parseInt(startHour),
      minute: parseInt(startMinute),
    });

    let businessEnd = nextCall.set({
      hour: parseInt(endHour),
      minute: parseInt(endMinute),
    });

    if (nextCall > businessEnd) {
      nextCall = nextCall.plus({ days: 1 }).startOf("day");
      businessStart = nextCall.set({
        hour: parseInt(startHour),
        minute: parseInt(startMinute),
      });
    }

    switch (lead.frequency) {
      case "DAILY":
        nextCall = nextCall.plus({ days: 1 });
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
          `Invalid frequency: ${lead.frequency}`,
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
    }

    nextCall = nextCall.set({
      hour: parseInt(startHour),
      minute: parseInt(startMinute),
    });

    let attempts = 0;
    const maxAttempts = 14;

    while (
      !lead.preferredCallDays.includes(nextCall.weekdayLong.toUpperCase())
    ) {
      nextCall = nextCall.plus({ days: 1 });
      attempts++;

      if (attempts >= maxAttempts) {
        throw new APIError(
          `Could not find suitable call time for lead ID: ${lead.id}`,
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    return nextCall;
  },

  async updateCallFrequency(
    leadId,
    callSettings,
    context = {
      currentTime: new Date("2025-01-06T04:15:26Z"),
      currentUser: "ravi-hisoka",
    }
  ) {
    const {
      frequency,
      timezone,
      businessHoursStart,
      businessHoursEnd,
      preferredCallDays,
    } = callSettings;

    try {
      return await db.transaction(async (trx) => {
        const lead = await trx
          .select()
          .from(leads)
          .where(eq(leads.id, leadId))
          .limit(1);

        if (!lead.length) {
          throw new APIError(
            `Lead not found with ID: ${leadId}`,
            404,
            ERROR_CODES.RESOURCE_NOT_FOUND
          );
        }

        const nextCallDate = this.calculateNextCallDate(
          {
            ...lead[0],
            frequency,
            timezone,
            businessHoursStart,
            businessHoursEnd,
            preferredCallDays,
          },
          DateTime.fromJSDate(context.currentTime)
        );

        await trx
          .update(leads)
          .set({
            frequency,
            timezone,
            businessHoursStart,
            businessHoursEnd,
            preferredCallDays,
            nextCallDate: nextCallDate.toJSDate(),
            updatedAt: context.currentTime,
            updatedBy: context.currentUser,
          })
          .where(eq(leads.id, leadId));

        return {
          id: leadId,
          frequency,
          timezone,
          businessHoursStart,
          businessHoursEnd,
          preferredCallDays,
          nextCallDate: nextCallDate.toJSDate(),
          nextCallLocalTime: nextCallDate
            .setZone(timezone)
            .toFormat("yyyy-MM-dd HH:mm:ss"),
        };
      });
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        `Failed to update call frequency: ${error.message}`,
        500,
        ERROR_CODES.DATABASE_ERROR
      );
    }
  },
};
