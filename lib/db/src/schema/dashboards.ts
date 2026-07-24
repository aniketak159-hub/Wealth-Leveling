import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dashboardsTable = pgTable("dashboards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  title: text("title").notNull().default("Novice Wealth Hunter"),
  level: integer("level").notNull().default(1),
  rank: text("rank").notNull().default("E"),
  xp: integer("xp").notNull().default(0),
  xpToNext: integer("xp_to_next").notNull().default(100),
  netWorth: numeric("net_worth", { precision: 15, scale: 2 }).notNull().default("0"),
  totalAssets: numeric("total_assets", { precision: 15, scale: 2 }).notNull().default("0"),
  // Stats
  statStr: integer("stat_str").notNull().default(10),
  statVit: integer("stat_vit").notNull().default(10),
  statInt: integer("stat_int").notNull().default(10),
  statAgi: integer("stat_agi").notNull().default(10),
  statPer: integer("stat_per").notNull().default(10),
  statLuk: integer("stat_luk").notNull().default(10),
  unspentPoints: integer("unspent_points").notNull().default(0),
  // Streak tracking
  streakDays: integer("streak_days").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: text("last_activity_date"), // YYYY-MM-DD UTC
  streakShields: integer("streak_shields").notNull().default(0),
  shieldsUsedTotal: integer("shields_used_total").notNull().default(0),
  // System log stored as newline-separated text
  systemLog: text("system_log").notNull().default("The System has been installed.\nWelcome, Player."),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDashboardSchema = createInsertSchema(dashboardsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;
export type Dashboard = typeof dashboardsTable.$inferSelect;
