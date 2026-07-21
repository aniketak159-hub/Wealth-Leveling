import { pgTable, text, serial, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questsTable = pgTable("quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("SYSTEM"), // SYSTEM | SELF
  targetAmount: numeric("target_amount", { precision: 15, scale: 2 }),
  currentAmount: numeric("current_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  xpReward: integer("xp_reward").notNull().default(100),
  frequency: text("frequency").notNull().default("ONGOING"), // DAILY | WEEKLY | MONTHLY | ONGOING
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertQuestSchema = createInsertSchema(questsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof questsTable.$inferSelect;
