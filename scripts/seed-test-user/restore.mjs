#!/usr/bin/env node
/**
 * Restore the jagruthi1221@gmail.com test user from the local snapshot.
 *
 * Usage:
 *   node scripts/seed-test-user/restore.mjs
 *     → uses the clerk_id stored in data.json (re-creates account as-is)
 *
 *   node scripts/seed-test-user/restore.mjs <new-clerk-id>
 *     → use this when the Clerk user was deleted and re-created under a new ID
 *       (find the new ID in the Replit Auth pane or from GET /api/me after signing in)
 *
 * The script is safe to run multiple times: it UPSERTs on clerk_id so it
 * won't create duplicates.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, "data.json"), "utf8"));

const clerkId = process.argv[2] || data.user.clerk_id;

if (!process.env.DATABASE_URL && !process.env.PGHOST) {
  console.error("❌  No database connection found. Make sure DATABASE_URL or PG* env vars are set.");
  process.exit(1);
}

const client = new pg.Client();
await client.connect();

console.log(`\n🗡  Restoring test user: ${data._meta.email}`);
console.log(`   Clerk ID: ${clerkId}\n`);

try {
  await client.query("BEGIN");

  // ── 1. Upsert user ──────────────────────────────────────────────────────────
  const userRes = await client.query(
    `INSERT INTO users (clerk_id, display_name, avatar_url, is_admin, pin_hash, totp_secret, totp_enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (clerk_id) DO UPDATE SET
       display_name   = EXCLUDED.display_name,
       avatar_url     = EXCLUDED.avatar_url,
       is_admin       = EXCLUDED.is_admin,
       pin_hash       = EXCLUDED.pin_hash,
       totp_secret    = EXCLUDED.totp_secret,
       totp_enabled   = EXCLUDED.totp_enabled,
       updated_at     = now()
     RETURNING id`,
    [
      clerkId,
      data.user.display_name,
      data.user.avatar_url,
      data.user.is_admin,
      data.user.pin_hash,
      data.user.totp_secret,
      data.user.totp_enabled,
    ]
  );
  const userId = userRes.rows[0].id;
  console.log(`✅  User upserted  (id=${userId})`);

  // ── 2. Upsert dashboard ──────────────────────────────────────────────────────
  const d = data.dashboard;
  await client.query(
    `INSERT INTO dashboards (
       user_id, display_name, title, level, rank, xp, xp_to_next,
       net_worth, total_assets,
       stat_str, stat_vit, stat_int, stat_agi, stat_per, stat_luk, unspent_points,
       streak_days, longest_streak, last_activity_date,
       streak_shields, shields_used_total, system_log
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
     ON CONFLICT (user_id) DO UPDATE SET
       display_name       = EXCLUDED.display_name,
       title              = EXCLUDED.title,
       level              = EXCLUDED.level,
       rank               = EXCLUDED.rank,
       xp                 = EXCLUDED.xp,
       xp_to_next         = EXCLUDED.xp_to_next,
       net_worth          = EXCLUDED.net_worth,
       total_assets       = EXCLUDED.total_assets,
       stat_str           = EXCLUDED.stat_str,
       stat_vit           = EXCLUDED.stat_vit,
       stat_int           = EXCLUDED.stat_int,
       stat_agi           = EXCLUDED.stat_agi,
       stat_per           = EXCLUDED.stat_per,
       stat_luk           = EXCLUDED.stat_luk,
       unspent_points     = EXCLUDED.unspent_points,
       streak_days        = EXCLUDED.streak_days,
       longest_streak     = EXCLUDED.longest_streak,
       last_activity_date = EXCLUDED.last_activity_date,
       streak_shields     = EXCLUDED.streak_shields,
       shields_used_total = EXCLUDED.shields_used_total,
       system_log         = EXCLUDED.system_log,
       updated_at         = now()`,
    [
      userId, d.display_name, d.title, d.level, d.rank, d.xp, d.xp_to_next,
      d.net_worth, d.total_assets,
      d.stat_str, d.stat_vit, d.stat_int, d.stat_agi, d.stat_per, d.stat_luk, d.unspent_points,
      d.streak_days, d.longest_streak, d.last_activity_date,
      d.streak_shields, d.shields_used_total, d.system_log,
    ]
  );
  console.log(`✅  Dashboard upserted`);

  // ── 3. Upsert budget ─────────────────────────────────────────────────────────
  const budgetRes = await client.query(
    `INSERT INTO budgets (user_id, monthly_income)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       monthly_income = EXCLUDED.monthly_income,
       updated_at     = now()
     RETURNING id`,
    [userId, data.budget.monthly_income]
  );
  const budgetId = budgetRes.rows[0].id;
  console.log(`✅  Budget upserted  (id=${budgetId})`);

  // ── 4. Budget items (delete + re-insert to preserve order) ──────────────────
  if (data.budget_items.length > 0) {
    await client.query(`DELETE FROM budget_items WHERE budget_id = $1`, [budgetId]);
    for (const item of data.budget_items) {
      await client.query(
        `INSERT INTO budget_items (budget_id, label, planned, actual, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [budgetId, item.label, item.planned, item.actual, item.sort_order]
      );
    }
    console.log(`✅  Budget items restored  (${data.budget_items.length} rows)`);
  } else {
    console.log(`ℹ️   No budget items to restore`);
  }

  // ── 5. Transactions ──────────────────────────────────────────────────────────
  if (data.transactions.length > 0) {
    await client.query(`DELETE FROM transactions WHERE budget_id = $1`, [budgetId]);
    for (const tx of data.transactions) {
      await client.query(
        `INSERT INTO transactions (budget_id, type, category, description, amount, date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [budgetId, tx.type, tx.category, tx.description, tx.amount, tx.date]
      );
    }
    console.log(`✅  Transactions restored  (${data.transactions.length} rows)`);
  } else {
    console.log(`ℹ️   No transactions to restore`);
  }

  // ── 6. Wealth ────────────────────────────────────────────────────────────────
  await client.query(
    `INSERT INTO wealth (user_id, net_worth)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       net_worth  = EXCLUDED.net_worth,
       updated_at = now()`,
    [userId, data.wealth.net_worth]
  );
  console.log(`✅  Wealth upserted`);

  // ── 7. Quests ────────────────────────────────────────────────────────────────
  if (data.quests.length > 0) {
    await client.query(`DELETE FROM quests WHERE user_id = $1`, [userId]);
    for (const q of data.quests) {
      await client.query(
        `INSERT INTO quests (user_id, title, description, category, target_amount, current_amount, xp_reward, frequency, completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, q.title, q.description, q.category, q.target_amount, q.current_amount, q.xp_reward, q.frequency, q.completed]
      );
    }
    console.log(`✅  Quests restored  (${data.quests.length} rows)`);
  } else {
    console.log(`ℹ️   No quests to restore`);
  }

  // ── 8. Skills ────────────────────────────────────────────────────────────────
  if (data.skills.length > 0) {
    await client.query(`DELETE FROM skills WHERE user_id = $1`, [userId]);
    for (const s of data.skills) {
      await client.query(
        `INSERT INTO skills (user_id, name, category, type, level, streak_count, xp_to_next, last_checkin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, s.name, s.category, s.type, s.level, s.streak_count, s.xp_to_next, s.last_checkin]
      );
    }
    console.log(`✅  Skills restored  (${data.skills.length} rows)`);
  } else {
    console.log(`ℹ️   No skills to restore`);
  }

  // ── 9. Skill tree unlocks ────────────────────────────────────────────────────
  if (data.skill_tree_unlocks.length > 0) {
    await client.query(`DELETE FROM skill_tree_unlocks WHERE user_id = $1`, [userId]);
    for (const u of data.skill_tree_unlocks) {
      await client.query(
        `INSERT INTO skill_tree_unlocks (user_id, tree_skill_id) VALUES ($1, $2)`,
        [userId, u.tree_skill_id]
      );
    }
    console.log(`✅  Skill tree unlocks restored  (${data.skill_tree_unlocks.length} rows)`);
  } else {
    console.log(`ℹ️   No skill tree unlocks to restore`);
  }

  // ── 10. Builds ───────────────────────────────────────────────────────────────
  if (data.builds.length > 0) {
    await client.query(`DELETE FROM builds WHERE user_id = $1`, [userId]);
    for (const b of data.builds) {
      await client.query(
        `INSERT INTO builds (user_id, name, description, rank, revenue, expenses)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, b.name, b.description, b.rank, b.revenue, b.expenses]
      );
    }
    console.log(`✅  Builds restored  (${data.builds.length} rows)`);
  } else {
    console.log(`ℹ️   No builds to restore`);
  }

  await client.query("COMMIT");
  console.log(`\n🎉  Restore complete! Sign in as ${data._meta.email} and the account will be ready.\n`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error("❌  Restore failed — rolled back.\n", err.message);
  process.exit(1);
} finally {
  await client.end();
}
