// src/services/interaction.service.js
import { db } from "../db/index.js";
import { interactions, leads, contacts } from "../db/schema/index.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { APIError, ERROR_CODES } from "../utils/error.utils.js";

export const createInteraction = async (interactionData, userId) => {
  try {
    console.log("Creating interaction:", { interactionData, userId });

    const [lead] = await db
      .select()
      .from(leads)
      .where(
        and(eq(leads.id, interactionData.leadId), eq(leads.userId, userId))
      );

    if (!lead) {
      throw new APIError(
        "Lead not found or unauthorized",
        404,
        ERROR_CODES.NOT_FOUND
      );
    }

    const [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, interactionData.contactId),
          eq(contacts.leadId, interactionData.leadId)
        )
      );

    if (!contact) {
      throw new APIError(
        "Contact not found or doesn't belong to this lead",
        404,
        ERROR_CODES.NOT_FOUND
      );
    }

    const newInteraction = await db
      .insert(interactions)
      .values({
        leadId: interactionData.leadId,
        contactId: interactionData.contactId,
        userId: userId,
        type: interactionData.type,
        status: interactionData.status,
        details: interactionData.notes,
        orderAmount: interactionData.orderAmount || 0,
        orderItems: interactionData.orderItems || {},
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      })
      .returning();

    return newInteraction[0];
  } catch (error) {
    console.error("Create interaction error:", error);
    if (error instanceof APIError) throw error;
    throw new APIError(
      "Failed to create interaction",
      500,
      ERROR_CODES.DB_ERROR
    );
  }
};

// Get interactions by lead
export const getInteractionsByLead = async (leadId, filters = {}) => {
  try {
    console.log("Fetching interactions for lead:", { leadId, filters });

    let query = db
      .select({
        id: interactions.id,
        leadId: interactions.leadId,
        contactId: interactions.contactId,
        userId: interactions.userId,
        type: interactions.type,
        status: interactions.status,
        details: interactions.details,
        orderAmount: interactions.orderAmount,
        orderItems: interactions.orderItems,
        createdAt: interactions.createdAt,
        updatedAt: interactions.updatedAt,
        createdBy: interactions.createdBy,
        contactName: contacts.name,
      })
      .from(interactions)
      .leftJoin(contacts, eq(interactions.contactId, contacts.id))
      .where(eq(interactions.leadId, leadId));

    if (filters.type) {
      query = query.where(eq(interactions.type, filters.type));
    }

    if (filters.status) {
      query = query.where(eq(interactions.status, filters.status));
    }

    if (filters.startDate && filters.endDate) {
      query = query.where(
        and(
          gte(interactions.createdAt, new Date(filters.startDate)),
          lte(interactions.createdAt, new Date(filters.endDate))
        )
      );
    }

    query = query.orderBy(desc(interactions.createdAt));

    const results = await query;
    console.log(`Found ${results.length} interactions`);

    return results;
  } catch (error) {
    console.error("Error fetching interactions:", error);
    throw new APIError(
      "Failed to fetch interactions",
      500,
      ERROR_CODES.DB_ERROR
    );
  }
};

export const getLastInteractionForLead = async (leadId) => {
  try {
    console.log("Fetching last interaction for lead:", leadId);

    const lastInteraction = await db
      .select({
        id: interactions.id,
        leadId: interactions.leadId,
        contactId: interactions.contactId,
        userId: interactions.userId,
        type: interactions.type,
        status: interactions.status,
        details: interactions.details,
        orderAmount: interactions.orderAmount,
        orderItems: interactions.orderItems,
        createdAt: interactions.createdAt,
        updatedAt: interactions.updatedAt,
        createdBy: interactions.createdBy,
        contactName: contacts.name,
        contactEmail: contacts.email,
        contactPhone: contacts.phone,
      })
      .from(interactions)
      .leftJoin(contacts, eq(interactions.contactId, contacts.id))
      .where(eq(interactions.leadId, leadId))
      .orderBy(desc(interactions.createdAt))
      .limit(1);

    console.log("Last interaction found:", lastInteraction[0]);
    return lastInteraction[0] || null;
  } catch (error) {
    console.error("Error fetching last interaction:", error);
    throw new APIError(
      "Failed to fetch last interaction",
      500,
      ERROR_CODES.DB_ERROR
    );
  }
};

export const getLeadInteractionStats = async (leadId) => {
  try {
    console.log("Fetching interaction stats for lead:", leadId);

    const stats = await db
      .select({
        totalInteractions: sql`COUNT(*)`,
        totalCalls: sql`COUNT(*) FILTER (WHERE ${interactions.type} = 'CALL')`,
        totalEmails: sql`COUNT(*) FILTER (WHERE ${interactions.type} = 'EMAIL')`,
        totalOrders: sql`COUNT(*) FILTER (WHERE ${interactions.type} = 'ORDER')`,
        totalOrderAmount: sql`COALESCE(SUM(${interactions.orderAmount}), 0)`,
        avgOrderAmount: sql`COALESCE(AVG(${interactions.orderAmount}), 0)`,
        lastInteractionDate: sql`MAX(${interactions.createdAt})`,
        completedCount: sql`COUNT(*) FILTER (WHERE ${interactions.status} = 'COMPLETED')`,
        noAnswerCount: sql`COUNT(*) FILTER (WHERE ${interactions.status} = 'NO_ANSWER')`,
        followUpCount: sql`COUNT(*) FILTER (WHERE ${interactions.status} = 'FOLLOW_UP_NEEDED')`,
      })
      .from(interactions)
      .where(eq(interactions.leadId, leadId))
      .groupBy(interactions.leadId);

    const defaultStats = {
      totalInteractions: 0,
      totalCalls: 0,
      totalEmails: 0,
      totalOrders: 0,
      totalOther: 0,
      totalOrderAmount: "0",
      avgOrderAmount: "0",
      lastInteractionDate: null,
      completedCount: 0,
      noAnswerCount: 0,
      followUpCount: 0,
    };

    const result = stats[0] || defaultStats;

    const {
      completedCount,
      noAnswerCount,
      followUpCount,
      lastInteractionDate,
      totalOrderAmount,
      avgOrderAmount,
      ...otherStats
    } = result;

    const formattedStats = {
      ...otherStats,
      byStatus: {
        COMPLETED: completedCount || 0,
        NO_ANSWER: noAnswerCount || 0,
        FOLLOW_UP_NEEDED: followUpCount || 0,
      },
      lastInteractionDate: lastInteractionDate
        ? new Date(lastInteractionDate).toISOString()
        : null,
      totalOrderAmount: parseFloat(totalOrderAmount).toFixed(2),
      avgOrderAmount: parseFloat(avgOrderAmount).toFixed(2),
    };

    console.log("Stats found:", formattedStats);
    return formattedStats;
  } catch (error) {
    console.error("Error fetching interaction stats:", error);
    throw new APIError(
      "Failed to fetch interaction statistics",
      500,
      ERROR_CODES.DB_ERROR
    );
  }
};
