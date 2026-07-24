import { Router, type IRouter } from "express";
import { db, dashboardsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// UTC date string helpers ─────────────────────────────────────────────────────
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 86_400_000;
  return Math.round((new Date(dateB).getTime() - new Date(dateA).getTime()) / msPerDay);
}

// Shield milestone map: streak day → shields granted ─────────────────────────
const SHIELD_MILESTONES: Record<number, number> = {
  3: 1,   // Welcome protection
  7: 1,   // One week
  14: 1,  // Fortnight
  30: 1,  // Monthly veteran
  60: 1,  // Dedicated player
  100: 2, // Century club
  365: 3, // Annual legend
};

// XP bonus for maintaining a streak ─────────────────────────────────────────
function streakXpBonus(days: number): number {
  if (days >= 100) return 50;
  if (days >= 30)  return 30;
  if (days >= 14)  return 20;
  if (days >= 7)   return 10;
  if (days >= 3)   return 5;
  return 2;
}

// ── GET /api/streak ──────────────────────────────────────────────────────────
router.get("/streak", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const [dash] = await db.select().from(dashboardsTable).where(eq(dashboardsTable.userId, user.id));

  if (!dash) {
    res.json({
      streakDays: 0,
      longestStreak: 0,
      streakShields: 0,
      shieldsUsedTotal: 0,
      lastActivityDate: null,
      alreadyCheckedIn: false,
    });
    return;
  }

  const today = todayUTC();
  const alreadyCheckedIn = dash.lastActivityDate === today;

  res.json({
    streakDays: dash.streakDays,
    longestStreak: dash.longestStreak,
    streakShields: dash.streakShields,
    shieldsUsedTotal: dash.shieldsUsedTotal,
    lastActivityDate: dash.lastActivityDate ?? null,
    alreadyCheckedIn,
  });
});

// ── POST /api/streak/checkin ─────────────────────────────────────────────────
router.post("/streak/checkin", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;

  const [dash] = await db.select().from(dashboardsTable).where(eq(dashboardsTable.userId, user.id));
  if (!dash) {
    res.status(404).json({ error: "Dashboard not found. Complete setup first." });
    return;
  }

  const today = todayUTC();

  // Already checked in today — idempotent, return current state
  if (dash.lastActivityDate === today) {
    res.json({
      alreadyCheckedIn: true,
      streakDays: dash.streakDays,
      longestStreak: dash.longestStreak,
      streakShields: dash.streakShields,
      shieldsUsedTotal: dash.shieldsUsedTotal,
      xpGained: 0,
      shieldBurned: false,
      streakReset: false,
      milestone: null,
    });
    return;
  }

  let streakDays = dash.streakDays;
  let longestStreak = dash.longestStreak;
  let streakShields = dash.streakShields;
  let shieldsUsedTotal = dash.shieldsUsedTotal;
  let shieldBurned = false;
  let streakReset = false;
  let xpGained = 0;
  const logLines: string[] = [];

  const lastDate = dash.lastActivityDate;

  if (!lastDate) {
    // First ever check-in
    streakDays = 1;
    xpGained = streakXpBonus(1);
    logLines.push("Day 1 streak started. The journey begins.");
  } else {
    const gap = daysBetween(lastDate, today);

    if (gap === 1) {
      // Perfect — consecutive day
      streakDays += 1;
      xpGained = streakXpBonus(streakDays);
      logLines.push(`Day ${streakDays} streak maintained. +${xpGained} XP bonus.`);
    } else if (gap >= 2) {
      if (streakShields > 0) {
        // Shield auto-activates — gap is forgiven
        streakShields -= 1;
        shieldsUsedTotal += 1;
        shieldBurned = true;
        streakDays += 1; // count today as the next day
        xpGained = streakXpBonus(streakDays);
        logLines.push(
          `STREAK SHIELD ACTIVATED — ${gap - 1} day gap forgiven. Shields remaining: ${streakShields}.`
        );
        logLines.push(`Day ${streakDays} streak continues. +${xpGained} XP bonus.`);
      } else {
        // No shields — streak breaks
        const brokenAt = streakDays;
        streakDays = 1;
        streakReset = true;
        xpGained = streakXpBonus(1);
        logLines.push(
          `Streak broken after ${brokenAt} days. No shields available. New streak started.`
        );
      }
    } else if (gap === 0) {
      // Shouldn't reach here (caught above) — safety fallback
      res.json({
        alreadyCheckedIn: true,
        streakDays: dash.streakDays,
        longestStreak: dash.longestStreak,
        streakShields: dash.streakShields,
        shieldsUsedTotal: dash.shieldsUsedTotal,
        xpGained: 0,
        shieldBurned: false,
        streakReset: false,
        milestone: null,
      });
      return;
    }
  }

  // Update longest streak
  if (streakDays > longestStreak) longestStreak = streakDays;

  // Check milestone rewards
  let milestone: { days: number; shields: number; label: string } | null = null;
  const milestoneShields = SHIELD_MILESTONES[streakDays];
  if (milestoneShields) {
    streakShields += milestoneShields;
    milestone = {
      days: streakDays,
      shields: milestoneShields,
      label: milestoneLabel(streakDays),
    };
    logLines.push(
      `MILESTONE: ${streakDays}-day streak! +${milestoneShields} Streak Shield${milestoneShields > 1 ? "s" : ""} earned.`
    );
  }

  // Award streak XP to dashboard
  const newXp = dash.xp + xpGained;

  // Append log entries
  const updatedLog = [dash.systemLog, ...logLines].join("\n");

  await db
    .update(dashboardsTable)
    .set({
      streakDays,
      longestStreak,
      lastActivityDate: today,
      streakShields,
      shieldsUsedTotal,
      xp: newXp,
      systemLog: updatedLog,
    })
    .where(eq(dashboardsTable.userId, user.id));

  res.json({
    alreadyCheckedIn: false,
    streakDays,
    longestStreak,
    streakShields,
    shieldsUsedTotal,
    xpGained,
    shieldBurned,
    streakReset,
    milestone,
  });
});

function milestoneLabel(days: number): string {
  if (days === 3)   return "Newcomer's Protection";
  if (days === 7)   return "One Week Standing";
  if (days === 14)  return "Fortnight Warrior";
  if (days === 30)  return "Monthly Veteran";
  if (days === 60)  return "Dedicated Player";
  if (days === 100) return "Century Club";
  if (days === 365) return "Annual Legend";
  return `${days}-Day Milestone`;
}

export default router;
