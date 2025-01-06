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
  time,
  numeric,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Define all ENUMs first

export const leadStatus = pgEnum("lead_status", [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "NEGOTIATING",
  "CONVERTED",
  "NOT_INTERESTED",
]);

export const restaurantType = pgEnum("restaurant_type", [
  "FINE_DINING",
  "CASUAL_DINING",
  "QSR",
]);

export const interactionType = pgEnum("interaction_type", [
  "CALL",
  "ORDER",
  "EMAIL",
]);

export const interactionStatus = pgEnum("interaction_status", [
  "COMPLETED",
  "NO_ANSWER",
  "FOLLOW_UP_NEEDED",
]);

export const callFrequency = pgEnum("call_frequency", [
  "DAILY",
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
]);

export const performanceStatus = pgEnum("performance_status", [
  "HIGH_PERFORMING",
  "STABLE",
  "NEEDS_ATTENTION",
  "UNDERPERFORMING",
]);

// 2. Define tables using the ENUMs
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
  address: text("address").notNull(),
  status: leadStatus("status").notNull().default("NEW"),
  restaurantType: restaurantType("restaurant_type"),
  notes: text("notes"),

  // Call planning fields
  timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),
  callFrequency: callFrequency("call_frequency"),
  lastCallDate: timestamp("last_call_date"),
  nextCallDate: timestamp("next_call_date"),
  businessHoursStart: time("business_hours_start"),
  businessHoursEnd: time("business_hours_end"),
  preferredCallDays: jsonb("preferred_call_days").default([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ]),

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
  leadId: integer("lead_id")
    .references(() => leads.id)
    .notNull(),
  contactId: integer("contact_id")
    .references(() => contacts.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  type: interactionType("type").notNull(),
  status: interactionStatus("status").notNull(),
  details: text("details").notNull(), // Make it required since it's important for tracking
  orderAmount: decimal("order_amount", { precision: 10, scale: 2 })
    .default("0")
    .notNull(), // Make it not null with default
  orderItems: jsonb("order_items").default("{}").notNull(), // Make it not null with default
  // Consider changing createdBy to match users table's id type
  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(), // Change to integer to match user.id
  createdAt: timestamp("created_at", { withTimezone: true }) // Add timezone support
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }) // Add timezone support
    .defaultNow()
    .notNull(),
});

export const leadPerformance = pgTable("lead_performance", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .references(() => leads.id)
    .notNull(),
  monthlyOrderCount: integer("monthly_order_count").default(0),
  lastOrderDate: timestamp("last_order_date"),
  averageOrderValue: numeric("average_order_value").default(0),
  orderFrequency: varchar("order_frequency", { length: 20 }),
  preferredOrderDays: jsonb("preferred_order_days").default([]),
  performanceStatus: performanceStatus("performance_status").default("STABLE"),
  lastStatusChange: timestamp("last_status_change"),
  orderTrend: varchar("order_trend", { length: 20 }),
  createdAt: timestamp("created_at").notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull(),
});

// Order history table for pattern analysis
export const orderHistory = pgTable("order_history", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .references(() => leads.id)
    .notNull(),

  orderValue: numeric("order_value").notNull(),
  orderDate: timestamp("order_date").notNull(),

  // System fields - using context time
  createdAt: timestamp("created_at").notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull(),
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

export const nextCallDateIndex = index(
  "idx_leads_next_call_date",
  leads.nextCallDate
);
