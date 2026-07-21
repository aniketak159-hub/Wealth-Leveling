import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wealthTable = pgTable("wealth", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  netWorth: numeric("net_worth", { precision: 15, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const wealthAssetsTable = pgTable("wealth_assets", {
  id: serial("id").primaryKey(),
  wealthId: integer("wealth_id").notNull(),
  label: text("label").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull().default("0"),
  category: text("category").notNull().default("OTHER"), // STOCKS|MUTUAL_FUNDS|REAL_ESTATE|CASH|CRYPTO|OTHER
});

export const insertWealthSchema = createInsertSchema(wealthTable).omit({ id: true, updatedAt: true });
export type InsertWealth = z.infer<typeof insertWealthSchema>;
export type Wealth = typeof wealthTable.$inferSelect;

export const insertWealthAssetSchema = createInsertSchema(wealthAssetsTable).omit({ id: true });
export type InsertWealthAsset = z.infer<typeof insertWealthAssetSchema>;
export type WealthAsset = typeof wealthAssetsTable.$inferSelect;
