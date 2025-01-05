// src/db/schema/index.js
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm"; // Add this import

// Define tables first
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

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  restaurantName: varchar("restaurant_name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  callFrequency: integer("call_frequency").notNull(),
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

export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  userId: integer("user_id").references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // 'call' or 'order'
  notes: text("notes"),
  orderValue: integer("order_value"),
  interactionDate: timestamp("interaction_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
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
