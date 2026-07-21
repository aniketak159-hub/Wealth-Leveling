import { Router, type IRouter } from "express";
import { db, skillsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import {
  ListSkillsResponse,
  CreateSkillBody,
  CreateSkillResponse,
  UpdateSkillParams,
  UpdateSkillBody,
  UpdateSkillResponse,
  DeleteSkillParams,
  CheckinSkillParams,
  CheckinSkillResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function skillToResponse(s: typeof skillsTable.$inferSelect) {
  return {
    id: s.id,
    userId: s.userId,
    name: s.name,
    category: s.category as "INVESTMENT" | "SAVINGS" | "KNOWLEDGE",
    type: s.type as "SYSTEM" | "SELF",
    level: s.level,
    streakCount: s.streakCount,
    lastCheckin: s.lastCheckin?.toISOString() ?? null,
    xpToNext: s.xpToNext,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/skills", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, user.id));
  res.json(ListSkillsResponse.parse(skills.map(skillToResponse)));
});

router.post("/skills", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const parsed = CreateSkillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [skill] = await db
    .insert(skillsTable)
    .values({
      userId: user.id,
      name: parsed.data.name,
      category: parsed.data.category,
      type: parsed.data.type ?? "SELF",
    })
    .returning();

  res.status(201).json(CreateSkillResponse.parse(skillToResponse(skill)));
});

router.patch("/skills/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const params = UpdateSkillParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSkillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;

  const [skill] = await db
    .update(skillsTable)
    .set(updates)
    .where(and(eq(skillsTable.id, params.data.id), eq(skillsTable.userId, user.id)))
    .returning();

  if (!skill) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }

  res.json(UpdateSkillResponse.parse(skillToResponse(skill)));
});

router.delete("/skills/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const params = DeleteSkillParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(skillsTable)
    .where(and(eq(skillsTable.id, params.data.id), eq(skillsTable.userId, user.id)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/skills/:id/checkin", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const params = CheckinSkillParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(skillsTable)
    .where(and(eq(skillsTable.id, params.data.id), eq(skillsTable.userId, user.id)));

  if (!existing) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }

  const now = new Date();
  const lastCheckin = existing.lastCheckin;
  const isNewStreak =
    !lastCheckin ||
    now.getTime() - lastCheckin.getTime() > 20 * 60 * 60 * 1000; // 20h gap

  const newStreak = isNewStreak ? existing.streakCount + 1 : existing.streakCount;
  const xpEarned = isNewStreak ? Math.min(50, 10 + existing.level * 5) : 0;
  const newLevel = xpEarned > 0 && newStreak % 5 === 0 ? existing.level + 1 : existing.level;
  const newXpToNext = Math.max(10, existing.xpToNext - xpEarned);

  const [updated] = await db
    .update(skillsTable)
    .set({ streakCount: newStreak, lastCheckin: now, level: newLevel, xpToNext: newXpToNext })
    .where(eq(skillsTable.id, existing.id))
    .returning();

  res.json(CheckinSkillResponse.parse(skillToResponse(updated)));
});

export default router;
