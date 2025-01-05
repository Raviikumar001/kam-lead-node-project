// src/db/schema/index.js
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  integer,
  boolean,
  jsonb,
  decimal,
  pgEnum,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Keep existing users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("kam"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  tokenVersion: integer("token_version").notNull().default(0),
});

// Define ENUMs for leads
const leadStatusEnum = pgEnum("lead_status", [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "NEGOTIATING",
  "CONVERTED",
  "NOT_INTERESTED",
]);

const restaurantTypeEnum = pgEnum("restaurant_type", [
  "FINE_DINING",
  "CASUAL_DINING",
  "QSR",
]);

export const interactionTypeEnum = pgEnum("interaction_type", [
  "CALL",
  "ORDER",
]);
export const interactionStatusEnum = pgEnum("interaction_status", [
  "COMPLETED",
  "NO_ANSWER",
  "FOLLOW_UP_NEEDED",
]);

// Updated leads table
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  restaurantName: varchar("restaurant_name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  status: leadStatusEnum("status").notNull().default("NEW"),
  restaurantType: restaurantTypeEnum("restaurant_type"),
  notes: text("notes"),
  callFrequency: integer("call_frequency"),
  lastCallDate: timestamp("last_call_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Updated interactions table with pgEnum
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .references(() => leads.id)
    .notNull(),
  contactId: integer("contact_id")
    .references(() => contacts.id)
    .notNull(),
  // Using pgEnum instead of varchar
  type: interactionTypeEnum("type").notNull(),
  status: interactionStatusEnum("status").notNull(),
  details: text("details"),
  // For orders specific data
  orderAmount: decimal("order_amount", { precision: 10, scale: 2 }).default(
    "0"
  ),
  orderItems: jsonb("order_items").default("{}"),
  // Tracking fields
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Then define relations
export const usersRelations = relations(users, ({ many }) => ({
  leads: many(leads),
  interactions: many(interactions),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  user: one(users, {
    fields: [leads.userId],
    references: [users.id],
  }),
  contacts: many(contacts),
  interactions: many(interactions),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  lead: one(leads, {
    fields: [contacts.leadId],
    references: [leads.id],
  }),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  lead: one(leads, {
    fields: [interactions.leadId],
    references: [leads.id],
  }),
  user: one(users, {
    fields: [interactions.userId],
    references: [users.id],
  }),
}));

export const interactionsByLeadIndex = index(
  "idx_interactions_lead_id",
  interactions.leadId
);
