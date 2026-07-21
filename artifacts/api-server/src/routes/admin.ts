import { Router, type IRouter } from "express";
import { db, usersTable, dashboardsTable, questsTable, skillsTable, buildsTable } from "@workspace/db";
import { eq, count, avg } from "drizzle-orm";
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
} from "@workspace/api-zod";

const router: IRouter = Router();

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

router.get("/admin/users", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable);

  const result = await Promise.all(users.map(async (u) => {
    const dash = await getDashboardForUser(u.id, u.displayName);
    const stats = await getUserStats(u.id);
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
  }));

  res.json(AdminListUsersResponse.parse(result));
});

router.get("/admin/users/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminGetUserParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, params.data.id));
  if (!user) {
    // Try by numeric id
    const numId = parseInt(params.data.id, 10);
    if (!isNaN(numId)) {
      const [userById] = await db.select().from(usersTable).where(eq(usersTable.id, numId));
      if (!userById) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      // continue with userById
      const dash = await getDashboardForUser(userById.id, userById.displayName);
      const stats = await getUserStats(userById.id);
      const quests = await db.select().from(questsTable).where(eq(questsTable.userId, userById.id));
      const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, userById.id));
      const builds = await db.select().from(buildsTable).where(eq(buildsTable.userId, userById.id));

      const adminUser = {
        id: userById.id,
        clerkId: userById.clerkId,
        displayName: userById.displayName,
        avatarUrl: userById.avatarUrl ?? null,
        isAdmin: userById.isAdmin,
        level: dash.level,
        rank: dash.rank,
        netWorth: parseFloat(dash.netWorth as string),
        xp: dash.xp,
        questCount: stats.questCount,
        skillCount: stats.skillCount,
        buildCount: stats.buildCount,
        createdAt: userById.createdAt.toISOString(),
      };

      res.json(AdminGetUserResponse.parse({
        user: adminUser,
        dashboard: {
          id: dash.id,
          userId: dash.userId,
          displayName: dash.displayName,
          title: dash.title,
          level: dash.level,
          rank: dash.rank,
          xp: dash.xp,
          xpToNext: dash.xpToNext,
          netWorth: parseFloat(dash.netWorth as string),
          totalAssets: parseFloat(dash.totalAssets as string),
          stats: {
            str: dash.statStr,
            vit: dash.statVit,
            int: dash.statInt,
            agi: dash.statAgi,
            per: dash.statPer,
            luk: dash.statLuk,
            unspentPoints: dash.unspentPoints,
          },
          systemLog: dash.systemLog.split("\n").filter(Boolean),
        },
        quests: quests.map(q => ({
          id: q.id, userId: q.userId, title: q.title,
          description: q.description ?? null,
          category: q.category as "SYSTEM" | "SELF",
          targetAmount: q.targetAmount ? parseFloat(q.targetAmount as string) : null,
          currentAmount: parseFloat(q.currentAmount as string),
          xpReward: q.xpReward,
          frequency: q.frequency as "DAILY" | "WEEKLY" | "MONTHLY" | "ONGOING",
          completed: q.completed,
          createdAt: q.createdAt.toISOString(),
        })),
        skills: skills.map(s => ({
          id: s.id, userId: s.userId, name: s.name,
          category: s.category as "INVESTMENT" | "SAVINGS" | "KNOWLEDGE",
          type: s.type as "SYSTEM" | "SELF",
          level: s.level,
          streakCount: s.streakCount,
          lastCheckin: s.lastCheckin?.toISOString() ?? null,
          xpToNext: s.xpToNext,
          createdAt: s.createdAt.toISOString(),
        })),
        builds: builds.map(b => ({
          id: b.id, userId: b.userId, name: b.name, description: b.description,
          rank: b.rank as "S" | "A" | "B" | "C" | "D" | "E",
          revenue: parseFloat(b.revenue as string),
          expenses: parseFloat(b.expenses as string),
          netProfit: parseFloat(b.revenue as string) - parseFloat(b.expenses as string),
          createdAt: b.createdAt.toISOString(),
        })),
      }));
      return;
    }
    res.status(404).json({ error: "User not found" });
    return;
  }

  const dash = await getDashboardForUser(user.id, user.displayName);
  const stats = await getUserStats(user.id);
  const quests = await db.select().from(questsTable).where(eq(questsTable.userId, user.id));
  const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, user.id));
  const builds = await db.select().from(buildsTable).where(eq(buildsTable.userId, user.id));

  const adminUser = {
    id: user.id,
    clerkId: user.clerkId,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    isAdmin: user.isAdmin,
    level: dash.level,
    rank: dash.rank,
    netWorth: parseFloat(dash.netWorth as string),
    xp: dash.xp,
    questCount: stats.questCount,
    skillCount: stats.skillCount,
    buildCount: stats.buildCount,
    createdAt: user.createdAt.toISOString(),
  };

  res.json(AdminGetUserResponse.parse({
    user: adminUser,
    dashboard: {
      id: dash.id,
      userId: dash.userId,
      displayName: dash.displayName,
      title: dash.title,
      level: dash.level,
      rank: dash.rank,
      xp: dash.xp,
      xpToNext: dash.xpToNext,
      netWorth: parseFloat(dash.netWorth as string),
      totalAssets: parseFloat(dash.totalAssets as string),
      stats: {
        str: dash.statStr,
        vit: dash.statVit,
        int: dash.statInt,
        agi: dash.statAgi,
        per: dash.statPer,
        luk: dash.statLuk,
        unspentPoints: dash.unspentPoints,
      },
      systemLog: dash.systemLog.split("\n").filter(Boolean),
    },
    quests: quests.map(q => ({
      id: q.id, userId: q.userId, title: q.title,
      description: q.description ?? null,
      category: q.category as "SYSTEM" | "SELF",
      targetAmount: q.targetAmount ? parseFloat(q.targetAmount as string) : null,
      currentAmount: parseFloat(q.currentAmount as string),
      xpReward: q.xpReward,
      frequency: q.frequency as "DAILY" | "WEEKLY" | "MONTHLY" | "ONGOING",
      completed: q.completed,
      createdAt: q.createdAt.toISOString(),
    })),
    skills: skills.map(s => ({
      id: s.id, userId: s.userId, name: s.name,
      category: s.category as "INVESTMENT" | "SAVINGS" | "KNOWLEDGE",
      type: s.type as "SYSTEM" | "SELF",
      level: s.level,
      streakCount: s.streakCount,
      lastCheckin: s.lastCheckin?.toISOString() ?? null,
      xpToNext: s.xpToNext,
      createdAt: s.createdAt.toISOString(),
    })),
    builds: builds.map(b => ({
      id: b.id, userId: b.userId, name: b.name, description: b.description,
      rank: b.rank as "S" | "A" | "B" | "C" | "D" | "E",
      revenue: parseFloat(b.revenue as string),
      expenses: parseFloat(b.expenses as string),
      netProfit: parseFloat(b.revenue as string) - parseFloat(b.expenses as string),
      createdAt: b.createdAt.toISOString(),
    })),
  }));
});

router.patch("/admin/users/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminUpdateUserParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const numId = parseInt(params.data.id, 10);
  if (isNaN(numId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.isAdmin !== undefined) updates.isAdmin = parsed.data.isAdmin;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, numId)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const dash = await getDashboardForUser(user.id, user.displayName);
  const stats = await getUserStats(user.id);

  res.json(AdminUpdateUserResponse.parse({
    id: user.id,
    clerkId: user.clerkId,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    isAdmin: user.isAdmin,
    level: dash.level,
    rank: dash.rank,
    netWorth: parseFloat(dash.netWorth as string),
    xp: dash.xp,
    questCount: stats.questCount,
    skillCount: stats.skillCount,
    buildCount: stats.buildCount,
    createdAt: user.createdAt.toISOString(),
  }));
});

router.delete("/admin/users/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminDeleteUserParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const numId = parseInt(params.data.id, 10);
  if (isNaN(numId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, numId)).returning();
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/admin/stats", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const [totalUsersResult] = await db.select({ count: count() }).from(usersTable);
  const [totalQuestsResult] = await db.select({ count: count() }).from(questsTable);
  const [totalBuildsResult] = await db.select({ count: count() }).from(buildsTable);
  const dashboards = await db.select().from(dashboardsTable);

  const avgLevel = dashboards.length > 0
    ? dashboards.reduce((sum, d) => sum + d.level, 0) / dashboards.length
    : 0;
  const avgNetWorth = dashboards.length > 0
    ? dashboards.reduce((sum, d) => sum + parseFloat(d.netWorth as string), 0) / dashboards.length
    : 0;

  res.json(AdminGetStatsResponse.parse({
    totalUsers: totalUsersResult.count,
    activeUsers: totalUsersResult.count,
    avgLevel,
    avgNetWorth,
    totalQuests: totalQuestsResult.count,
    totalBuilds: totalBuildsResult.count,
  }));
});

router.get("/admin/leaderboard", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  const entries = await Promise.all(users.map(async (u) => {
    const dash = await getDashboardForUser(u.id, u.displayName);
    return {
      userId: u.id,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl ?? null,
      level: dash.level,
      tierRank: dash.rank,
      netWorth: parseFloat(dash.netWorth as string),
      xp: dash.xp,
    };
  }));

  entries.sort((a, b) => b.level !== a.level ? b.level - a.level : b.xp - a.xp);

  res.json(AdminGetLeaderboardResponse.parse(
    entries.map((e, i) => ({ rank: i + 1, ...e }))
  ));
});

export default router;
