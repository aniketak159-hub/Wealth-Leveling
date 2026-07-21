import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const buildsTable = pgTable("builds", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  rank: text("rank").notNull().default("D"), // S|A|B|C|D|E
  revenue: numeric("revenue", { precision: 15, scale: 2 }).notNull().default("0"),
  expenses: numeric("expenses", { precision: 15, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBuildSchema = createInsertSchema(buildsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBuild = z.infer<typeof insertBuildSchema>;
export type Build = typeof buildsTable.$inferSelect;
