// src/services/interaction.service.js
import { db } from "../db/index.js";
import { interactions, leads, contacts } from "../db/schema/index.js";
import { eq, and } from "drizzle-orm";
import { APIError, ERROR_CODES } from "../utils/error.utils.js";

// Create new interaction (call or order)
export const createInteraction = async (interactionData, userId) => {
  try {
    const newInteraction = await db
      .insert(interactions)
      .values({
        ...interactionData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newInteraction[0];
  } catch (error) {
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
    let query = db
      .select({
        interactions: interactions,
        contactName: contacts.name,
      })
      .from(interactions)
      .leftJoin(contacts, eq(interactions.contactId, contacts.id))
      .where(eq(interactions.leadId, leadId));

    // Apply filters
    if (filters.type) {
      query = query.where(eq(interactions.type, filters.type));
    }

    // Order by most recent first
    query = query.orderBy(desc(interactions.createdAt));

    return await query;
  } catch (error) {
    throw new APIError(
      "Failed to fetch interactions",
      500,
      ERROR_CODES.DB_ERROR
    );
  }
};

export const getLastInteractionForLead = async (leadId) => {
  try {
    const lastInteraction = await db
      .select()
      .from(interactions)
      .where(eq(interactions.leadId, leadId))
      .orderBy(desc(interactions.createdAt))
      .limit(1);

    return lastInteraction[0] || null;
  } catch (error) {
    throw new APIError(
      "Failed to fetch last interaction",
      500,
      ERROR_CODES.DB_ERROR
    );
  }
};

// Get interaction statistics for a lead
export const getLeadInteractionStats = async (leadId) => {
  try {
    const stats = await db
      .select({
        totalCalls: sql`COUNT(*) FILTER (WHERE ${interactions.type} = 'CALL')`,
        totalOrders: sql`COUNT(*) FILTER (WHERE ${interactions.type} = 'ORDER')`,
        totalOrderAmount: sql`SUM(${interactions.orderAmount})`,
        lastInteractionDate: sql`MAX(${interactions.createdAt})`,
      })
      .from(interactions)
      .where(eq(interactions.leadId, leadId))
      .groupBy(interactions.leadId);

    return (
      stats[0] || {
        totalCalls: 0,
        totalOrders: 0,
        totalOrderAmount: 0,
        lastInteractionDate: null,
      }
    );
  } catch (error) {
    throw new APIError(
      "Failed to fetch interaction statistics",
      500,
      ERROR_CODES.DB_ERROR
    );
  }
};
