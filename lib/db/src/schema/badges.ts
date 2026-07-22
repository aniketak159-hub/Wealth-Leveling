import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const badgesTable = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("🏅"),
  rarity: text("rarity").notNull().default("COMMON"), // COMMON | RARE | EPIC | LEGENDARY
  triggerType: text("trigger_type").notNull().default("MANUAL"), // QUEST_COUNT | SKILL_COUNT | BUILD_COUNT | NET_WORTH | LEVEL | DAYS_ACTIVE | MANUAL
  triggerValue: integer("trigger_value").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Badge = typeof badgesTable.$inferSelect;
export type InsertBadge = typeof badgesTable.$inferInsert;
