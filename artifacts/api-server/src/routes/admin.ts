import { Router, type IRouter } from "express";
import { db, usersTable, dashboardsTable, questsTable, skillsTable, buildsTable, badgesTable, milestonesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import {
  AdminListUsersResponse,
  AdminGetUserParams,
  AdminGetUserResponse,
  AdminUpdateUserParams,
  AdminUpdateUserBody,
  AdminUpdateUserResponse,
  AdminDeleteUserParams,
  AdminGetStatsResponse,
  AdminGetLeaderboardResponse,
  AdminListBadgesResponse,
  AdminCreateBadgeBody,
  AdminUpdateBadgeParams,
  AdminUpdateBadgeBody,
  AdminDeleteBadgeParams,
  AdminBadgeResponse,
  AdminListMilestonesResponse,
  AdminCreateMilestoneBody,
  AdminUpdateMilestoneParams,
  AdminUpdateMilestoneBody,
  AdminDeleteMilestoneParams,
  AdminMilestoneResponse,
  AdminPushQuestBody,
  AdminPushQuestResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUserStats(userId: number) {
  const [qr] = await db.select({ count: count() }).from(questsTable).where(eq(questsTable.userId, userId));
  const [sr] = await db.select({ count: count() }).from(skillsTable).where(eq(skillsTable.userId, userId));
  const [br] = await db.select({ count: count() }).from(buildsTable).where(eq(buildsTable.userId, userId));
  return { questCount: qr.count, skillCount: sr.count, buildCount: br.count };
}

async function getDashboardForUser(userId: number, displayName: string) {
  let [dash] = await db.select().from(dashboardsTable).where(eq(dashboardsTable.userId, userId));
  if (!dash) {
    [dash] = await db.insert(dashboardsTable).values({ userId, displayName }).returning();
  }
  return dash;
}

function mapUserRow(u: typeof usersTable.$inferSelect, dash: typeof dashboardsTable.$inferSelect, stats: { questCount: number; skillCount: number; buildCount: number }) {
  return {
    id: u.id,
    clerkId: u.clerkId,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl ?? null,
    isAdmin: u.isAdmin,
    level: dash.level,
    rank: dash.rank,
    netWorth: parseFloat(dash.netWorth as string),
    xp: dash.xp,
    questCount: stats.questCount,
    skillCount: stats.skillCount,
    buildCount: stats.buildCount,
    createdAt: u.createdAt.toISOString(),
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

router.get("/admin/users", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  const result = await Promise.all(users.map(async (u) => {
    const dash = await getDashboardForUser(u.id, u.displayName);
    const stats = await getUserStats(u.id);
    return mapUserRow(u, dash, stats);
  }));
  res.json(AdminListUsersResponse.parse(result));
});

router.get("/admin/users/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminGetUserParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  let user = await db.select().from(usersTable).where(eq(usersTable.clerkId, params.data.id)).then(r => r[0]);
  if (!user) {
    const numId = parseInt(params.data.id, 10);
    if (isNaN(numId)) { res.status(404).json({ error: "User not found" }); return; }
    user = await db.select().from(usersTable).where(eq(usersTable.id, numId)).then(r => r[0]);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
  }

  const dash = await getDashboardForUser(user.id, user.displayName);
  const stats = await getUserStats(user.id);
  const quests = await db.select().from(questsTable).where(eq(questsTable.userId, user.id));
  const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, user.id));
  const builds = await db.select().from(buildsTable).where(eq(buildsTable.userId, user.id));

  res.json(AdminGetUserResponse.parse({
    user: mapUserRow(user, dash, stats),
    dashboard: {
      id: dash.id, userId: dash.userId, displayName: dash.displayName, title: dash.title,
      level: dash.level, rank: dash.rank, xp: dash.xp, xpToNext: dash.xpToNext,
      netWorth: parseFloat(dash.netWorth as string), totalAssets: parseFloat(dash.totalAssets as string),
      stats: { str: dash.statStr, vit: dash.statVit, int: dash.statInt, agi: dash.statAgi, per: dash.statPer, luk: dash.statLuk, unspentPoints: dash.unspentPoints },
      systemLog: dash.systemLog.split("\n").filter(Boolean),
    },
    quests: quests.map(q => ({
      id: q.id, userId: q.userId, title: q.title, description: q.description ?? null,
      category: q.category,
      targetAmount: q.targetAmount ? parseFloat(q.targetAmount as string) : null,
      currentAmount: parseFloat(q.currentAmount as string),
      xpReward: q.xpReward, frequency: q.frequency,
      completed: q.completed, createdAt: q.createdAt.toISOString(),
    })),
    skills: skills.map(s => ({
      id: s.id, userId: s.userId, name: s.name,
      category: s.category, type: s.type,
      level: s.level, streakCount: s.streakCount, lastCheckin: s.lastCheckin?.toISOString() ?? null,
      xpToNext: s.xpToNext, createdAt: s.createdAt.toISOString(),
    })),
    builds: builds.map(b => ({
      id: b.id, userId: b.userId, name: b.name, description: b.description,
      rank: b.rank,
      revenue: parseFloat(b.revenue as string), expenses: parseFloat(b.expenses as string),
      netProfit: parseFloat(b.revenue as string) - parseFloat(b.expenses as string),
      createdAt: b.createdAt.toISOString(),
    })),
  }));
});

router.patch("/admin/users/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminUpdateUserParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = AdminUpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const numId = parseInt(params.data.id, 10);
  if (isNaN(numId)) { res.status(400).json({ error: "Invalid user id" }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.isAdmin !== undefined) updates.isAdmin = parsed.data.isAdmin;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, numId)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const dash = await getDashboardForUser(user.id, user.displayName);
  const stats = await getUserStats(user.id);
  res.json(AdminUpdateUserResponse.parse(mapUserRow(user, dash, stats)));
});

router.delete("/admin/users/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminDeleteUserParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const numId = parseInt(params.data.id, 10);
  if (isNaN(numId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, numId)).returning();
  if (!deleted) { res.status(404).json({ error: "User not found" }); return; }
  res.sendStatus(204);
});

// ─── Stats & Leaderboard ──────────────────────────────────────────────────────

router.get("/admin/stats", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const [totalUsersResult] = await db.select({ count: count() }).from(usersTable);
  const [totalQuestsResult] = await db.select({ count: count() }).from(questsTable);
  const [totalBuildsResult] = await db.select({ count: count() }).from(buildsTable);
  const dashboards = await db.select().from(dashboardsTable);
  const avgLevel = dashboards.length > 0 ? dashboards.reduce((s, d) => s + d.level, 0) / dashboards.length : 0;
  const avgNetWorth = dashboards.length > 0 ? dashboards.reduce((s, d) => s + parseFloat(d.netWorth as string), 0) / dashboards.length : 0;
  res.json(AdminGetStatsResponse.parse({
    totalUsers: totalUsersResult.count, activeUsers: totalUsersResult.count,
    avgLevel, avgNetWorth, totalQuests: totalQuestsResult.count, totalBuilds: totalBuildsResult.count,
  }));
});

router.get("/admin/leaderboard", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  const entries = await Promise.all(users.map(async (u) => {
    const dash = await getDashboardForUser(u.id, u.displayName);
    return { userId: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl ?? null, level: dash.level, tierRank: dash.rank, netWorth: parseFloat(dash.netWorth as string), xp: dash.xp };
  }));
  entries.sort((a, b) => b.level !== a.level ? b.level - a.level : b.xp - a.xp);
  res.json(AdminGetLeaderboardResponse.parse(entries.map((e, i) => ({ rank: i + 1, ...e }))));
});

// ─── Quest Push ───────────────────────────────────────────────────────────────

router.post("/admin/quests/push", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminPushQuestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { userId, title, description, category = "SYSTEM", targetAmount, xpReward = 100, frequency = "ONGOING" } = parsed.data;

  let targetUsers: { id: number }[];
  if (userId !== undefined) {
    const [u] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId));
    if (!u) { res.status(404).json({ error: "User not found" }); return; }
    targetUsers = [u];
  } else {
    targetUsers = await db.select({ id: usersTable.id }).from(usersTable);
  }

  const insertValues = targetUsers.map(u => ({
    userId: u.id,
    title,
    description,
    category,
    targetAmount: targetAmount ? String(targetAmount) : undefined,
    xpReward,
    frequency,
  }));

  if (insertValues.length > 0) {
    await db.insert(questsTable).values(insertValues);
  }

  res.json(AdminPushQuestResponse.parse({
    pushed: insertValues.length,
    message: userId ? `Quest pushed to user #${userId}` : `Quest pushed to all ${insertValues.length} hunters`,
  }));
});

// ─── Badges ───────────────────────────────────────────────────────────────────

router.get("/admin/badges", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const badges = await db.select().from(badgesTable).orderBy(badgesTable.createdAt);
  const mapped = badges.map(b => ({
    id: b.id, name: b.name, description: b.description, icon: b.icon,
    rarity: b.rarity, triggerType: b.triggerType,
    triggerValue: b.triggerValue, createdAt: b.createdAt.toISOString(),
  }));
  res.json(AdminListBadgesResponse.parse(mapped));
});

router.post("/admin/badges", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminCreateBadgeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [badge] = await db.insert(badgesTable).values({
    name: parsed.data.name,
    description: parsed.data.description ?? "",
    icon: parsed.data.icon ?? "🏅",
    rarity: parsed.data.rarity ?? "COMMON",
    triggerType: parsed.data.triggerType ?? "MANUAL",
    triggerValue: parsed.data.triggerValue ?? 0,
  }).returning();

  res.status(201).json(AdminBadgeResponse.parse({
    id: badge.id, name: badge.name, description: badge.description, icon: badge.icon,
    rarity: badge.rarity, triggerType: badge.triggerType,
    triggerValue: badge.triggerValue, createdAt: badge.createdAt.toISOString(),
  }));
});

router.patch("/admin/badges/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateBadgeParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = AdminUpdateBadgeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const numId = parseInt(params.data.id, 10);
  if (isNaN(numId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.icon !== undefined) updates.icon = parsed.data.icon;
  if (parsed.data.rarity !== undefined) updates.rarity = parsed.data.rarity;
  if (parsed.data.triggerType !== undefined) updates.triggerType = parsed.data.triggerType;
  if (parsed.data.triggerValue !== undefined) updates.triggerValue = parsed.data.triggerValue;

  const [badge] = await db.update(badgesTable).set(updates).where(eq(badgesTable.id, numId)).returning();
  if (!badge) { res.status(404).json({ error: "Badge not found" }); return; }

  res.json(AdminBadgeResponse.parse({
    id: badge.id, name: badge.name, description: badge.description, icon: badge.icon,
    rarity: badge.rarity, triggerType: badge.triggerType,
    triggerValue: badge.triggerValue, createdAt: badge.createdAt.toISOString(),
  }));
});

router.delete("/admin/badges/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = AdminDeleteBadgeParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const numId = parseInt(params.data.id, 10);
  if (isNaN(numId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(badgesTable).where(eq(badgesTable.id, numId)).returning();
  if (!deleted) { res.status(404).json({ error: "Badge not found" }); return; }
  res.sendStatus(204);
});

// ─── Milestones ───────────────────────────────────────────────────────────────

router.get("/admin/milestones", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const milestones = await db.select().from(milestonesTable).orderBy(milestonesTable.createdAt);
  const mappedMs = milestones.map(m => ({
    id: m.id, name: m.name, description: m.description, icon: m.icon,
    category: m.category, threshold: parseFloat(m.threshold as string),
    xpReward: m.xpReward, createdAt: m.createdAt.toISOString(),
  }));
  res.json(AdminListMilestonesResponse.parse(mappedMs));
});

router.post("/admin/milestones", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminCreateMilestoneBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [milestone] = await db.insert(milestonesTable).values({
    name: parsed.data.name,
    description: parsed.data.description ?? "",
    icon: parsed.data.icon ?? "🎯",
    category: parsed.data.category ?? "QUEST",
    threshold: String(parsed.data.threshold ?? 0),
    xpReward: parsed.data.xpReward ?? 100,
  }).returning();

  res.status(201).json(AdminMilestoneResponse.parse({
    id: milestone.id, name: milestone.name, description: milestone.description, icon: milestone.icon,
    category: milestone.category, threshold: parseFloat(milestone.threshold as string),
    xpReward: milestone.xpReward, createdAt: milestone.createdAt.toISOString(),
  }));
});

router.patch("/admin/milestones/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateMilestoneParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = AdminUpdateMilestoneBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const numId = parseInt(params.data.id, 10);
  if (isNaN(numId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.icon !== undefined) updates.icon = parsed.data.icon;
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;
  if (parsed.data.threshold !== undefined) updates.threshold = String(parsed.data.threshold);
  if (parsed.data.xpReward !== undefined) updates.xpReward = parsed.data.xpReward;

  const [milestone] = await db.update(milestonesTable).set(updates).where(eq(milestonesTable.id, numId)).returning();
  if (!milestone) { res.status(404).json({ error: "Milestone not found" }); return; }

  res.json(AdminMilestoneResponse.parse({
    id: milestone.id, name: milestone.name, description: milestone.description, icon: milestone.icon,
    category: milestone.category, threshold: parseFloat(milestone.threshold as string),
    xpReward: milestone.xpReward, createdAt: milestone.createdAt.toISOString(),
  }));
});

router.delete("/admin/milestones/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = AdminDeleteMilestoneParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const numId = parseInt(params.data.id, 10);
  if (isNaN(numId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(milestonesTable).where(eq(milestonesTable.id, numId)).returning();
  if (!deleted) { res.status(404).json({ error: "Milestone not found" }); return; }
  res.sendStatus(204);
});

export default router;
