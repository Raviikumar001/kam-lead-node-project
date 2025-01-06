// src/services/call-planning.service.js
import { DateTime } from "luxon";
import { db } from "../db/index.js";
import { leads } from "../db/schema/index.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { APIError, ERROR_CODES } from "../utils/error.utils.js";

export const CallPlanningService = {
  async getTodaysCalls(userTimezone, context) {
    try {
      console.log("Context:", {
        currentTime: context.currentTime,
        currentUser: context.currentUser,
        userTimezone,
      });

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

      console.log("Query parameters:", {
        startOfDay: startOfDay.toISO(),
        endOfDay: endOfDay.toISO(),
        userTimezone,
      });

      const calls = await db
        .select({
          id: leads.id,
          userId: leads.userId,
          restaurantName: leads.restaurantName,
          address: leads.address,
          status: leads.status,
          restaurantType: leads.restaurantType,
          notes: leads.notes,
          timezone: leads.timezone,
          callFrequency: leads.callFrequency,
          lastCallDate: leads.lastCallDate,
          nextCallDate: leads.nextCallDate,
          businessHoursStart: leads.businessHoursStart,
          businessHoursEnd: leads.businessHoursEnd,
          preferredCallDays: leads.preferredCallDays,
          createdAt: leads.createdAt,
          updatedAt: leads.updatedAt,
        })
        .from(leads)
        .where(
          and(
            gte(leads.nextCallDate, startOfDay.toJSDate()),
            lte(leads.nextCallDate, endOfDay.toJSDate())
          )
        );

      console.log(`Found ${calls.length} calls before filtering`);

      const validCalls = calls.filter((lead) => {
        if (!lead.nextCallDate) {
          console.log(`Skipping lead ${lead.id}: No next call date`);
          return false;
        }

        const leadCallTime = DateTime.fromJSDate(lead.nextCallDate).setZone(
          lead.timezone
        );

        if (!leadCallTime.isValid) {
          console.warn(
            `Invalid timezone for lead ${lead.id}: ${lead.timezone}`
          );
          return false;
        }

        if (!lead.businessHoursStart || !lead.businessHoursEnd) {
          console.warn(`Missing business hours for lead ${lead.id}`);
          return false;
        }

        // Convert TIME type to HH:mm format
        const startTime = lead.businessHoursStart.toString().slice(0, 5);
        const endTime = lead.businessHoursEnd.toString().slice(0, 5);

        const [startHour, startMinute] = startTime.split(":");
        const [endHour, endMinute] = endTime.split(":");

        const businessStart = leadCallTime.set({
          hour: parseInt(startHour),
          minute: parseInt(startMinute),
        });

        let businessEnd = leadCallTime.set({
          hour: parseInt(endHour),
          minute: parseInt(endMinute),
        });

        if (businessEnd < businessStart) {
          businessEnd = businessEnd.plus({ days: 1 });
        }

        const isWithinHours =
          leadCallTime >= businessStart && leadCallTime <= businessEnd;

        if (!isWithinHours) {
          console.log(`Lead ${lead.id} call time outside business hours`);
        }

        return isWithinHours;
      });

      console.log(`Returning ${validCalls.length} valid calls`);

      return validCalls.map((call) => ({
        id: call.id,
        userId: call.userId,
        restaurantName: call.restaurantName,
        address: call.address,
        status: call.status,
        restaurantType: call.restaurantType,
        notes: call.notes,
        callDetails: {
          timezone: call.timezone,
          frequency: call.callFrequency,
          lastCallDate: call.lastCallDate,
          nextCallDate: call.nextCallDate,
          businessHours: {
            start: call.businessHoursStart.toString().slice(0, 5),
            end: call.businessHoursEnd.toString().slice(0, 5),
          },
          preferredCallDays: call.preferredCallDays || [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
          ],
          scheduledTime: {
            local: DateTime.fromJSDate(call.nextCallDate)
              .setZone(call.timezone)
              .toFormat("yyyy-MM-dd HH:mm:ss"),
            user: DateTime.fromJSDate(call.nextCallDate)
              .setZone(userTimezone)
              .toFormat("yyyy-MM-dd HH:mm:ss"),
          },
        },
        metadata: {
          createdAt: call.createdAt,
          updatedAt: call.updatedAt,
        },
      }));
    } catch (error) {
      console.error("Error in getTodaysCalls:", error);
      if (error instanceof APIError) throw error;
      throw new APIError(
        `Failed to fetch today's calls: ${error.message}`,
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
            updatedBy: context.currentUser,
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
    let nextCall = fromTime.setZone(lead.timezone);
    if (!nextCall.isValid) {
      throw new APIError(
        `Invalid timezone: ${lead.timezone}`,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const [startHour, startMinute] = lead.businessHoursStart.split(":");
    const [endHour, endMinute] = lead.businessHoursEnd.split(":");

    const businessStart = nextCall.set({
      hour: parseInt(startHour),
      minute: parseInt(startMinute),
    });

    if (nextCall.hour >= parseInt(endHour)) {
      nextCall = nextCall.plus({ days: 1 }).set({
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

    let attempts = 0;
    const maxAttempts = 14;

    while (
      !lead.preferredCallDays.includes(nextCall.weekdayLong.toUpperCase())
    ) {
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

// // src/services/call-planning.service.js
// import { DateTime } from "luxon";
// import { db } from "../db/index.js";
// import { leads } from "../db/schema/index.js";
// import { eq, and, gte, lte } from "drizzle-orm";
// import { APIError, ERROR_CODES } from "../utils/error.utils.js";

// export const CallPlanningService = {
//   async getTodaysCalls(
//     userTimezone,
//     context = {
//       currentTime: new Date("2025-01-06T04:15:26Z"),
//       currentUser: "ravi-hisoka",
//     }
//   ) {
//     try {
//       const userDateTime = DateTime.fromJSDate(context.currentTime).setZone(
//         userTimezone
//       );

//       if (!userDateTime.isValid) {
//         throw new APIError(
//           `Invalid timezone: ${userTimezone}`,
//           400,
//           ERROR_CODES.VALIDATION_ERROR
//         );
//       }

//       const startOfDay = userDateTime.startOf("day");
//       const endOfDay = userDateTime.endOf("day");

//       const calls = await db
//         .select({
//           id: leads.id,
//           name: leads.name,
//           timezone: leads.timezone,
//           nextCallDate: leads.nextCallDate,
//           businessHoursStart: leads.businessHoursStart,
//           businessHoursEnd: leads.businessHoursEnd,
//           frequency: leads.frequency,
//           preferredCallDays: leads.preferredCallDays,
//         })
//         .from(leads)
//         .where(
//           and(
//             gte(leads.nextCallDate, startOfDay.toJSDate()),
//             lte(leads.nextCallDate, endOfDay.toJSDate())
//           )
//         );

//       const validCalls = calls.filter((call) => {
//         const callDateTime = DateTime.fromJSDate(call.nextCallDate).setZone(
//           call.timezone
//         );

//         const [startHour, startMinute] = call.businessHoursStart.split(":");
//         const [endHour, endMinute] = call.businessHoursEnd.split(":");

//         const businessStart = callDateTime.set({
//           hour: parseInt(startHour),
//           minute: parseInt(startMinute),
//         });

//         let businessEnd = callDateTime.set({
//           hour: parseInt(endHour),
//           minute: parseInt(endMinute),
//         });

//         if (businessEnd < businessStart) {
//           businessEnd = businessEnd.plus({ days: 1 });
//         }

//         return callDateTime >= businessStart && callDateTime <= businessEnd;
//       });

//       return validCalls;
//     } catch (error) {
//       if (error instanceof APIError) throw error;
//       throw new APIError(
//         `Failed to fetch today's calls: ${error.message}`,
//         500,
//         ERROR_CODES.DATABASE_ERROR
//       );
//     }
//   },

//   async updateCallSchedule(
//     leadId,
//     callCompletedTime,
//     context = {
//       currentTime: new Date("2025-01-06T04:15:26Z"),
//       currentUser: "ravi-hisoka",
//     }
//   ) {
//     try {
//       return await db.transaction(async (trx) => {
//         const lead = await trx
//           .select()
//           .from(leads)
//           .where(eq(leads.id, leadId))
//           .limit(1);

//         if (!lead.length) {
//           throw new APIError(
//             `Lead not found with ID: ${leadId}`,
//             404,
//             ERROR_CODES.RESOURCE_NOT_FOUND
//           );
//         }

//         const nextCallDate = this.calculateNextCallDate(
//           lead[0],
//           DateTime.fromJSDate(context.currentTime)
//         );

//         await trx
//           .update(leads)
//           .set({
//             lastCallDate: callCompletedTime,
//             nextCallDate: nextCallDate.toJSDate(),
//             updatedAt: context.currentTime,
//             updatedBy: context.currentUser,
//           })
//           .where(eq(leads.id, leadId));

//         return {
//           nextCallDate: nextCallDate.toJSDate(),
//           localTime: nextCallDate
//             .setZone(lead[0].timezone)
//             .toFormat("yyyy-MM-dd HH:mm:ss"),
//         };
//       });
//     } catch (error) {
//       if (error instanceof APIError) throw error;
//       throw new APIError(
//         `Failed to update call schedule: ${error.message}`,
//         500,
//         ERROR_CODES.DATABASE_ERROR
//       );
//     }
//   },

//   calculateNextCallDate(lead, currentTime) {
//     let nextCall = currentTime.setZone(lead.timezone);

//     if (!nextCall.isValid) {
//       throw new APIError(
//         `Invalid timezone: ${lead.timezone}`,
//         400,
//         ERROR_CODES.VALIDATION_ERROR
//       );
//     }

//     const [startHour, startMinute] = lead.businessHoursStart.split(":");
//     const [endHour, endMinute] = lead.businessHoursEnd.split(":");

//     let businessStart = nextCall.set({
//       hour: parseInt(startHour),
//       minute: parseInt(startMinute),
//     });

//     let businessEnd = nextCall.set({
//       hour: parseInt(endHour),
//       minute: parseInt(endMinute),
//     });

//     if (nextCall > businessEnd) {
//       nextCall = nextCall.plus({ days: 1 }).startOf("day");
//       businessStart = nextCall.set({
//         hour: parseInt(startHour),
//         minute: parseInt(startMinute),
//       });
//     }

//     switch (lead.frequency) {
//       case "DAILY":
//         nextCall = nextCall.plus({ days: 1 });
//         break;
//       case "WEEKLY":
//         nextCall = nextCall.plus({ weeks: 1 });
//         break;
//       case "BIWEEKLY":
//         nextCall = nextCall.plus({ weeks: 2 });
//         break;
//       case "MONTHLY":
//         nextCall = nextCall.plus({ months: 1 });
//         break;
//       default:
//         throw new APIError(
//           `Invalid frequency: ${lead.frequency}`,
//           400,
//           ERROR_CODES.VALIDATION_ERROR
//         );
//     }

//     nextCall = nextCall.set({
//       hour: parseInt(startHour),
//       minute: parseInt(startMinute),
//     });

//     let attempts = 0;
//     const maxAttempts = 14;

//     while (
//       !lead.preferredCallDays.includes(nextCall.weekdayLong.toUpperCase())
//     ) {
//       nextCall = nextCall.plus({ days: 1 });
//       attempts++;

//       if (attempts >= maxAttempts) {
//         throw new APIError(
//           `Could not find suitable call time for lead ID: ${lead.id}`,
//           400,
//           ERROR_CODES.VALIDATION_ERROR
//         );
//       }
//     }

//     return nextCall;
//   },

//   async updateCallFrequency(
//     leadId,
//     callSettings,
//     context = {
//       currentTime: new Date("2025-01-06T04:15:26Z"),
//       currentUser: "ravi-hisoka",
//     }
//   ) {
//     const {
//       frequency,
//       timezone,
//       businessHoursStart,
//       businessHoursEnd,
//       preferredCallDays,
//     } = callSettings;

//     try {
//       return await db.transaction(async (trx) => {
//         const lead = await trx
//           .select()
//           .from(leads)
//           .where(eq(leads.id, leadId))
//           .limit(1);

//         if (!lead.length) {
//           throw new APIError(
//             `Lead not found with ID: ${leadId}`,
//             404,
//             ERROR_CODES.RESOURCE_NOT_FOUND
//           );
//         }

//         const nextCallDate = this.calculateNextCallDate(
//           {
//             ...lead[0],
//             frequency,
//             timezone,
//             businessHoursStart,
//             businessHoursEnd,
//             preferredCallDays,
//           },
//           DateTime.fromJSDate(context.currentTime)
//         );

//         await trx
//           .update(leads)
//           .set({
//             frequency,
//             timezone,
//             businessHoursStart,
//             businessHoursEnd,
//             preferredCallDays,
//             nextCallDate: nextCallDate.toJSDate(),
//             updatedAt: context.currentTime,
//             updatedBy: context.currentUser,
//           })
//           .where(eq(leads.id, leadId));

//         return {
//           id: leadId,
//           frequency,
//           timezone,
//           businessHoursStart,
//           businessHoursEnd,
//           preferredCallDays,
//           nextCallDate: nextCallDate.toJSDate(),
//           nextCallLocalTime: nextCallDate
//             .setZone(timezone)
//             .toFormat("yyyy-MM-dd HH:mm:ss"),
//         };
//       });
//     } catch (error) {
//       if (error instanceof APIError) throw error;
//       throw new APIError(
//         `Failed to update call frequency: ${error.message}`,
//         500,
//         ERROR_CODES.DATABASE_ERROR
//       );
//     }
//   },
// };
