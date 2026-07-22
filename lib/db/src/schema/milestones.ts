import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";

export const milestonesTable = pgTable("milestones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("🎯"),
  category: text("category").notNull().default("QUEST"), // QUEST | SKILL | BUILD | WEALTH | CHARACTER
  threshold: numeric("threshold", { precision: 15, scale: 2 }).notNull().default("0"),
  xpReward: integer("xp_reward").notNull().default(100),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Milestone = typeof milestonesTable.$inferSelect;
export type InsertMilestone = typeof milestonesTable.$inferInsert;
