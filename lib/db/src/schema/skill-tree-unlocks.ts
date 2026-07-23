import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const skillTreeUnlocksTable = pgTable("skill_tree_unlocks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  treeSkillId: text("tree_skill_id").notNull(), // e.g. "inv-t1-01"
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
});
