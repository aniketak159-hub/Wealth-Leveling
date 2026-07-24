import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const budgetsTable = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  monthlyIncome: numeric("monthly_income", { precision: 15, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const budgetItemsTable = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").notNull(),
  label: text("label").notNull(),
  planned: numeric("planned", { precision: 15, scale: 2 }).notNull().default("0"),
  actual: numeric("actual", { precision: 15, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBudgetSchema = createInsertSchema(budgetsTable).omit({ id: true, updatedAt: true });
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgetsTable.$inferSelect;

export const insertBudgetItemSchema = createInsertSchema(budgetItemsTable).omit({ id: true });
export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;
export type BudgetItem = typeof budgetItemsTable.$inferSelect;

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
