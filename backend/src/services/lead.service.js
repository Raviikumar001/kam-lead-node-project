// src/services/lead.service.js
import { db } from "../db/index.js";
import { leads } from "../db/schema/index.js";
import { eq, desc, sql } from "drizzle-orm";
import { APIError } from "../utils/error.utils.js";

export class LeadService {
  async createLead(leadData, userId) {
    try {
      const newLead = await db
        .insert(leads)
        .values({
          ...leadData,
          userId,
          status: "NEW",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return newLead[0];
    } catch (error) {
      throw new APIError("Failed to create lead");
    }
  }

  async updateLead(id, updateData, userId) {
    const existingLead = await this.findLeadByIdAndUser(id, userId);

    if (!existingLead) {
      throw new APIError("Lead not found or unauthorized");
    }

    try {
      const updatedLead = await db
        .update(leads)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, parseInt(id)))
        .returning();

      return updatedLead[0];
    } catch (error) {
      throw new APIError("Failed to update lead");
    }
  }

  async getLeads(userId, filters = {}) {
    try {
      const { status, search, sort = "updatedAt" } = filters;

      let query = db.select().from(leads).where(eq(leads.userId, userId));

      if (status) {
        query = query.where(eq(leads.status, status));
      }

      if (search) {
        query = query.where(sql`leads.restaurant_name ILIKE ${`%${search}%`}`);
      }

      query = query.orderBy(desc(leads[sort]));

      return await query;
    } catch (error) {
      throw new APIError("Failed to fetch leads");
    }
  }

  async getLeadById(id, userId) {
    const lead = await this.findLeadByIdAndUser(id, userId);

    if (!lead) {
      throw new APIError("Lead not found or unauthorized");
    }

    return lead;
  }

  async findLeadByIdAndUser(id, userId) {
    try {
      const lead = await db
        .select()
        .from(leads)
        .where(eq(leads.id, parseInt(id)))
        .where(eq(leads.userId, userId));

      return lead[0];
    } catch (error) {
      throw new APIError("Error finding lead");
    }
  }
}
