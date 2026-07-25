#!/usr/bin/env node
/**
 * Snapshot jagruthi1221@gmail.com's current data to data.json.
 *
 * Run this any time you want to update the backup (e.g. after adding quests,
 * skills, or other progress you want preserved).
 *
 * Usage:
 *   node scripts/seed-test-user/export.mjs
 */

import { writeFileSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "data.json");
const existing = JSON.parse(readFileSync(outPath, "utf8"));

const client = new pg.Client();
await client.connect();

const q = (sql, params) => client.query(sql, params).then(r => r.rows);

try {
  const [user] = await q(
    `SELECT * FROM users WHERE clerk_id = $1`,
    [existing.user.clerk_id]
  );
  if (!user) {
    console.error(`❌  User with clerk_id ${existing.user.clerk_id} not found in DB.`);
    console.error(`   If the Clerk user was deleted and re-created, run restore.mjs first with the new clerk_id.`);
    process.exit(1);
  }
  const uid = user.id;

  const [dashboard] = await q(`SELECT * FROM dashboards WHERE user_id = $1`, [uid]);
  const [budget]    = await q(`SELECT * FROM budgets    WHERE user_id = $1`, [uid]);
  const budgetId    = budget?.id;
  const budgetItems = budgetId ? await q(`SELECT * FROM budget_items WHERE budget_id = $1`, [budgetId]) : [];
  const transactions = budgetId ? await q(`SELECT * FROM transactions WHERE budget_id = $1`, [budgetId]) : [];
  const quests      = await q(`SELECT * FROM quests WHERE user_id = $1`, [uid]);
  const skills      = await q(`SELECT * FROM skills WHERE user_id = $1`, [uid]);
  const unlocks     = await q(`SELECT * FROM skill_tree_unlocks WHERE user_id = $1`, [uid]);
  const builds      = await q(`SELECT * FROM builds WHERE user_id = $1`, [uid]);
  const [wealth]    = await q(`SELECT * FROM wealth WHERE user_id = $1`, [uid]);

  const snapshot = {
    _meta: {
      ...existing._meta,
      exportedAt: new Date().toISOString(),
    },
    user: {
      clerk_id:     user.clerk_id,
      display_name: user.display_name,
      avatar_url:   user.avatar_url,
      is_admin:     user.is_admin,
      pin_hash:     user.pin_hash,
      totp_secret:  user.totp_secret,
      totp_enabled: user.totp_enabled,
    },
    dashboard: dashboard ? {
      display_name:       dashboard.display_name,
      title:              dashboard.title,
      level:              dashboard.level,
      rank:               dashboard.rank,
      xp:                 dashboard.xp,
      xp_to_next:         dashboard.xp_to_next,
      net_worth:          dashboard.net_worth,
      total_assets:       dashboard.total_assets,
      stat_str:           dashboard.stat_str,
      stat_vit:           dashboard.stat_vit,
      stat_int:           dashboard.stat_int,
      stat_agi:           dashboard.stat_agi,
      stat_per:           dashboard.stat_per,
      stat_luk:           dashboard.stat_luk,
      unspent_points:     dashboard.unspent_points,
      streak_days:        dashboard.streak_days,
      longest_streak:     dashboard.longest_streak,
      last_activity_date: dashboard.last_activity_date,
      streak_shields:     dashboard.streak_shields,
      shields_used_total: dashboard.shields_used_total,
      system_log:         dashboard.system_log,
    } : {},
    budget: { monthly_income: budget?.monthly_income ?? "0.00" },
    budget_items: budgetItems.map(({ id, budget_id, ...rest }) => rest),
    transactions:  transactions.map(({ id, budget_id, created_at, ...rest }) => rest),
    quests:  quests.map(({ id, user_id, created_at, updated_at, completed_at, ...rest }) => ({
      ...rest,
      completed_at: completed_at ? completed_at.toISOString() : null,
    })),
    skills:  skills.map(({ id, user_id, created_at, updated_at, ...rest }) => rest),
    skill_tree_unlocks: unlocks.map(({ id, user_id, unlocked_at, ...rest }) => rest),
    builds:  builds.map(({ id, user_id, created_at, updated_at, ...rest }) => rest),
    wealth:  { net_worth: wealth?.net_worth ?? "0.00" },
  };

  writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`✅  Snapshot saved to scripts/seed-test-user/data.json`);
  console.log(`   Level ${snapshot.dashboard.level} · ${snapshot.dashboard.rank} Rank · ${snapshot.dashboard.xp} XP`);
  console.log(`   Quests: ${snapshot.quests.length}  Skills: ${snapshot.skills.length}  Builds: ${snapshot.builds.length}`);
} finally {
  await client.end();
}
