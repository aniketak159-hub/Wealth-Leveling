import { Router, type IRouter } from "express";
import { db, dashboardsTable, questsTable, skillsTable, buildsTable } from "@workspace/db";
import { eq, count, avg } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import {
  GetDashboardResponse,
  GetDashboardSummaryResponse,
  UpdateStatsBody,
  UpdateStatsResponse,
  RunEvaluationBody,
  RunEvaluationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function calcLevel(xp: number): { level: number; rank: string; xpToNext: number } {
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  const xpToNext = Math.pow(level, 2) * 100;
  let rank = "E";
  if (level >= 50) rank = "S";
  else if (level >= 30) rank = "A";
  else if (level >= 20) rank = "B";
  else if (level >= 10) rank = "C";
  else if (level >= 5) rank = "D";
  return { level, rank, xpToNext };
}

function calcTitle(level: number): string {
  if (level >= 50) return "Sovereign Wealth Master";
  if (level >= 30) return "Elite Financial Commander";
  if (level >= 20) return "Wealth Architect";
  if (level >= 10) return "Seasoned Wealth Hunter";
  if (level >= 5) return "Apprentice Wealth Hunter";
  return "Novice Wealth Hunter";
}

async function getOrCreateDashboard(userId: number, displayName: string) {
  let [dash] = await db.select().from(dashboardsTable).where(eq(dashboardsTable.userId, userId));
  if (!dash) {
    [dash] = await db
      .insert(dashboardsTable)
      .values({ userId, displayName })
      .returning();
  }
  return dash;
}

function dashToResponse(d: typeof dashboardsTable.$inferSelect) {
  return {
    id: d.id,
    userId: d.userId,
    displayName: d.displayName,
    title: d.title,
    level: d.level,
    rank: d.rank,
    xp: d.xp,
    xpToNext: d.xpToNext,
    netWorth: parseFloat(d.netWorth as string),
    totalAssets: parseFloat(d.totalAssets as string),
    stats: {
      str: d.statStr,
      vit: d.statVit,
      int: d.statInt,
      agi: d.statAgi,
      per: d.statPer,
      luk: d.statLuk,
      unspentPoints: d.unspentPoints,
    },
    systemLog: d.systemLog.split("\n").filter(Boolean),
  };
}

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const dash = await getOrCreateDashboard(user.id, user.displayName);
  res.json(GetDashboardResponse.parse(dashToResponse(dash)));
});

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const dash = await getOrCreateDashboard(user.id, user.displayName);

  const [activeQuestsResult] = await db
    .select({ count: count() })
    .from(questsTable)
    .where(eq(questsTable.userId, user.id));

  const [skillsResult] = await db
    .select({ count: count() })
    .from(skillsTable)
    .where(eq(skillsTable.userId, user.id));

  const [buildsResult] = await db
    .select({ count: count() })
    .from(buildsTable)
    .where(eq(buildsTable.userId, user.id));

  const allQuests = await db.select().from(questsTable).where(eq(questsTable.userId, user.id));
  const completed = allQuests.filter((q) => q.completed).length;
  const completionRate = allQuests.length > 0 ? (completed / allQuests.length) * 100 : 0;

  res.json(GetDashboardSummaryResponse.parse({
    level: dash.level,
    rank: dash.rank,
    netWorth: parseFloat(dash.netWorth as string),
    xp: dash.xp,
    xpToNext: dash.xpToNext,
    questCompletionRate: completionRate,
    activeQuests: activeQuestsResult.count,
    totalSkills: skillsResult.count,
    totalBuilds: buildsResult.count,
  }));
});

router.patch("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const parsed = UpdateStatsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const dash = await getOrCreateDashboard(user.id, user.displayName);
  const spent = Object.values(parsed.data).filter(v => typeof v === "number").reduce((a, b) => a + (b as number), 0);
  if (spent > dash.unspentPoints) {
    res.status(400).json({ error: "Not enough unspent points" });
    return;
  }

  const updates: Record<string, unknown> = { unspentPoints: dash.unspentPoints - spent };
  if (parsed.data.str !== undefined) updates.statStr = dash.statStr + parsed.data.str;
  if (parsed.data.vit !== undefined) updates.statVit = dash.statVit + parsed.data.vit;
  if (parsed.data.int !== undefined) updates.statInt = dash.statInt + parsed.data.int;
  if (parsed.data.agi !== undefined) updates.statAgi = dash.statAgi + parsed.data.agi;
  if (parsed.data.per !== undefined) updates.statPer = dash.statPer + parsed.data.per;
  if (parsed.data.luk !== undefined) updates.statLuk = dash.statLuk + parsed.data.luk;

  const [updated] = await db
    .update(dashboardsTable)
    .set(updates)
    .where(eq(dashboardsTable.userId, user.id))
    .returning();

  res.json(UpdateStatsResponse.parse(dashToResponse(updated)));
});

router.post("/dashboard/evaluation", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const parsed = RunEvaluationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const dash = await getOrCreateDashboard(user.id, user.displayName);
  const data = parsed.data;

  // Calculate XP from financial metrics
  let xpGained = 0;
  xpGained += Math.floor((data.savingsRate || 0) * 2); // up to 200 XP
  xpGained += Math.floor((data.budgetAdherence || 0) * 1.5); // up to 150 XP
  xpGained += Math.min(100, Math.floor((data.emergencyFundMonths || 0) * 16)); // up to 100 XP
  xpGained += Math.min(100, Math.floor((data.investmentGrowth || 0) * 5)); // up to 100 XP
  xpGained += Math.min(50, Math.floor((data.diversificationScore || 0) * 0.5)); // up to 50 XP
  xpGained = Math.max(10, xpGained);

  const newXp = dash.xp + xpGained;
  const { level: newLevel, rank: newRank, xpToNext: newXpToNext } = calcLevel(newXp);
  const leveledUp = newLevel > dash.level;
  const newTitle = calcTitle(newLevel);

  // Calculate stat bonuses from evaluation
  const statBonus = Math.floor(xpGained / 100);

  const newNetWorth = data.netWorth;
  let logEntries = dash.systemLog;
  const logLine = `Monthly evaluation complete. +${xpGained} XP earned.`;
  if (leveledUp) logEntries += `\nLevel up! Now Level ${newLevel}.`;
  logEntries += `\n${logLine}`;

  const [updated] = await db
    .update(dashboardsTable)
    .set({
      xp: newXp,
      xpToNext: newXpToNext,
      level: newLevel,
      rank: newRank,
      title: newTitle,
      netWorth: String(newNetWorth),
      totalAssets: String(newNetWorth),
      unspentPoints: dash.unspentPoints + statBonus,
      systemLog: logEntries,
    })
    .where(eq(dashboardsTable.userId, user.id))
    .returning();

  res.json(RunEvaluationResponse.parse({
    xpGained,
    leveledUp,
    newLevel,
    newXp,
    updatedDashboard: dashToResponse(updated),
  }));
});

export default router;
