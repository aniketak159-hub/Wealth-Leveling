import { Router, type IRouter } from "express";
import { db, skillTreeUnlocksTable, dashboardsTable } from "@workspace/db";
import { eq, and, like, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const SKILL_ID_RE = /^(inv|sav|kno)-t([1-5])-(0[1-9]|10)$/;

// GET /api/skill-tree — returns the user's unlock state
router.get("/skill-tree", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;

  const [dashboard] = await db
    .select({ unspentPoints: dashboardsTable.unspentPoints })
    .from(dashboardsTable)
    .where(eq(dashboardsTable.userId, user.id));

  const unlocks = await db
    .select({ treeSkillId: skillTreeUnlocksTable.treeSkillId })
    .from(skillTreeUnlocksTable)
    .where(eq(skillTreeUnlocksTable.userId, user.id));

  res.json({
    skillPoints: dashboard?.unspentPoints ?? 0,
    unlockedSkillIds: unlocks.map((u) => u.treeSkillId),
  });
});

// POST /api/skill-tree/unlock — spend 1 skill point to unlock a predefined skill
router.post("/skill-tree/unlock", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;

  const { skillId } = req.body ?? {};
  if (typeof skillId !== "string" || !SKILL_ID_RE.test(skillId)) {
    res.status(400).json({ error: "Invalid skill ID format." });
    return;
  }
  const match = skillId.match(SKILL_ID_RE)!;
  const prefix = match[1];
  const tier = parseInt(match[2]);

  // Check not already unlocked
  const [existing] = await db
    .select({ id: skillTreeUnlocksTable.id })
    .from(skillTreeUnlocksTable)
    .where(
      and(
        eq(skillTreeUnlocksTable.userId, user.id),
        eq(skillTreeUnlocksTable.treeSkillId, skillId),
      ),
    );
  if (existing) {
    res.status(409).json({ error: "Skill already unlocked." });
    return;
  }

  // Tier 2+ requires at least 6 unlocks in the previous tier
  if (tier > 1) {
    const prevPrefix = `${prefix}-t${tier - 1}-%`;
    const [{ prevCount }] = await db
      .select({ prevCount: sql<number>`count(*)::int` })
      .from(skillTreeUnlocksTable)
      .where(
        and(
          eq(skillTreeUnlocksTable.userId, user.id),
          like(skillTreeUnlocksTable.treeSkillId, prevPrefix),
        ),
      );
    if (prevCount < 6) {
      res.status(403).json({
        error: `Unlock 6 skills in Tier ${tier - 1} first. You have ${prevCount}/6.`,
      });
      return;
    }
  }

  // Check skill points
  const [dashboard] = await db
    .select({ unspentPoints: dashboardsTable.unspentPoints, id: dashboardsTable.id })
    .from(dashboardsTable)
    .where(eq(dashboardsTable.userId, user.id));

  if (!dashboard || dashboard.unspentPoints < 1) {
    res.status(400).json({ error: "Not enough skill points. Complete a monthly evaluation to earn more." });
    return;
  }

  // Atomically unlock and deduct
  await db
    .insert(skillTreeUnlocksTable)
    .values({ userId: user.id, treeSkillId: skillId });
  await db
    .update(dashboardsTable)
    .set({ unspentPoints: dashboard.unspentPoints - 1 })
    .where(eq(dashboardsTable.id, dashboard.id));

  res.json({
    success: true,
    skillId,
    skillPointsRemaining: dashboard.unspentPoints - 1,
  });
});

export default router;
