// src/services/contact.service.js
import { db } from "../db/index.js";
import { contacts, leads } from "../db/schema/index.js";
import { eq, and, desc } from "drizzle-orm";
import {
  NotFoundError,
  DatabaseError,
  ValidationError,
} from "../utils/error.util.js";

// Helper Functions
const validateContactAccess = async (contactId, userId) => {
  const contact = await db
    .select()
    .from(contacts)
    .innerJoin(leads, eq(contacts.leadId, leads.id))
    .where(and(eq(contacts.id, parseInt(contactId)), eq(leads.userId, userId)));

  if (!contact.length) {
    throw new NotFoundError("Contact not found or unauthorized");
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
      throw new NotFoundError("Lead not found or unauthorized");
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
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError("Failed to create contact");
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
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError("Failed to update contact");
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
      throw new NotFoundError("Lead not found or unauthorized");
    }

    const leadContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.leadId, leadId))
      .orderBy(desc(contacts.isPrimary));

    return leadContacts;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError("Failed to fetch contacts");
  }
};

export const getContactById = async (contactId, userId) => {
  try {
    const contact = await validateContactAccess(contactId, userId);
    return contact;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError("Failed to fetch contact");
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
      throw new ValidationError("Cannot delete the only contact for a lead");
    }

    // If this is a primary contact, throw error unless it's the only contact
    if (contact.isPrimary && contactCount[0].count > 1) {
      throw new ValidationError(
        "Cannot delete primary contact. Please set another contact as primary first."
      );
    }

    await db.delete(contacts).where(eq(contacts.id, parseInt(contactId)));

    return true;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError)
      throw error;
    throw new DatabaseError("Failed to delete contact");
  }
};
