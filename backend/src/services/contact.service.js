// src/services/contact.service.js
import { db } from "../db/index.js";
import { contacts, leads } from "../db/schema/index.js";
import { eq, and, desc } from "drizzle-orm";
import { ERROR_CODES } from "../utils/error.utils.js";

// Helper Functions
const validateContactAccess = async (contactId, userId) => {
  const contact = await db
    .select()
    .from(contacts)
    .innerJoin(leads, eq(contacts.leadId, leads.id))
    .where(and(eq(contacts.id, parseInt(contactId)), eq(leads.userId, userId)));

  if (!contact.length) {
    throw new APIError(
      "Contact not found or unauthorized",
      404,
      ERROR_CODES,
      NOT_FOUND
    );
  }

  return contact[0].contacts;
};

const unsetPrimaryContact = async (leadId) => {
  await db
    .update(contacts)
    .set({ isPrimary: false })
    .where(eq(contacts.leadId, leadId));
};

// Service Functions
export const createContact = async (contactData, leadId, userId) => {
  try {
    // Verify the lead exists and belongs to the user
    const lead = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.userId, userId)));

    if (!lead.length) {
      throw new APIError(
        "Lead not found or unauthorized",
        404,
        ERROR_CODES.NOT_FOUND
      );
    }

    // If this contact is to be primary, unset any existing primary contact
    if (contactData.isPrimary) {
      await unsetPrimaryContact(leadId);
    }

    const newContact = await db
      .insert(contacts)
      .values({
        ...contactData,
        leadId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newContact[0];
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError("Failed to create contact", 500, ERROR_CODES.DB_ERROR);
  }
};

export const updateContact = async (contactId, updateData, userId) => {
  try {
    const existingContact = await validateContactAccess(contactId, userId);

    if (updateData.isPrimary) {
      await unsetPrimaryContact(existingContact.leadId);
    }

    const updatedContact = await db
      .update(contacts)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, parseInt(contactId)))
      .returning();

    return updatedContact[0];
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError("Failed to update contact", 500, ERROR_CODES.DB_ERROR);
  }
};

export const getContactsByLead = async (leadId, userId) => {
  try {
    // Verify lead belongs to user
    const lead = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.userId, userId)));

    if (!lead.length) {
      throw new APIError(
        "Lead not found or unauthorized",
        404,
        ERROR_CODES.NOT_FOUND
      );
    }

    const leadContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.leadId, leadId))
      .orderBy(desc(contacts.isPrimary));

    return leadContacts;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError("Failed to fetch contacts", 404, ERROR_CODES.DB_ERROR);
  }
};

export const getContactById = async (contactId, userId) => {
  try {
    const contact = await validateContactAccess(contactId, userId);
    return contact;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError("Failed to fetch contact", 500, ERROR_CODES.DB_ERROR);
  }
};

export const deleteContact = async (contactId, userId) => {
  try {
    const contact = await validateContactAccess(contactId, userId);

    // Check if this is the only contact for the lead
    const contactCount = await db
      .select({ count: sql`count(*)` })
      .from(contacts)
      .where(eq(contacts.leadId, contact.leadId));

    if (contactCount[0].count === 1) {
      throw new APIError(
        "Cannot delete the only contact for a lead",
        400,
        ERROR_CODES.VALIDATION_ERRORs
      );
    }

    // If this is a primary contact, throw error unless it's the only contact
    if (contact.isPrimary && contactCount[0].count > 1) {
      throw new APIError(
        "Cannot delete primary contact. Please set another contact as primary first.",
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    await db.delete(contacts).where(eq(contacts.id, parseInt(contactId)));

    return true;
  } catch (error) {
    if (error instanceof APIError || error instanceof APIError) throw error;
    throw new APIError("Failed to delete contact", 500, ERROR_CODES.DB_ERROR);
  }
};
