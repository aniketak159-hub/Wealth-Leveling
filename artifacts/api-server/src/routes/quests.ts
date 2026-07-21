import { Router, type IRouter } from "express";
import { db, questsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import {
  ListQuestsResponse,
  CreateQuestBody,
  CreateQuestResponse,
  UpdateQuestParams,
  UpdateQuestBody,
  UpdateQuestResponse,
  DeleteQuestParams,
  LogQuestProgressParams,
  LogQuestProgressBody,
  LogQuestProgressResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function questToResponse(q: typeof questsTable.$inferSelect) {
  return {
    id: q.id,
    userId: q.userId,
    title: q.title,
    description: q.description ?? null,
    category: q.category as "SYSTEM" | "SELF",
    targetAmount: q.targetAmount ? parseFloat(q.targetAmount as string) : null,
    currentAmount: parseFloat(q.currentAmount as string),
    xpReward: q.xpReward,
    frequency: q.frequency as "DAILY" | "WEEKLY" | "MONTHLY" | "ONGOING",
    completed: q.completed,
    createdAt: q.createdAt.toISOString(),
  };
}

router.get("/quests", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const quests = await db.select().from(questsTable).where(eq(questsTable.userId, user.id));
  res.json(ListQuestsResponse.parse(quests.map(questToResponse)));
});

router.post("/quests", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const parsed = CreateQuestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [quest] = await db
    .insert(questsTable)
    .values({
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category ?? "SELF",
      targetAmount: parsed.data.targetAmount ? String(parsed.data.targetAmount) : null,
      xpReward: parsed.data.xpReward,
      frequency: parsed.data.frequency,
    })
    .returning();

  res.status(201).json(CreateQuestResponse.parse(questToResponse(quest)));
});

router.patch("/quests/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const params = UpdateQuestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateQuestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.targetAmount !== undefined) updates.targetAmount = String(parsed.data.targetAmount);
  if (parsed.data.currentAmount !== undefined) updates.currentAmount = String(parsed.data.currentAmount);
  if (parsed.data.xpReward !== undefined) updates.xpReward = parsed.data.xpReward;
  if (parsed.data.completed !== undefined) updates.completed = parsed.data.completed;

  const [quest] = await db
    .update(questsTable)
    .set(updates)
    .where(and(eq(questsTable.id, params.data.id), eq(questsTable.userId, user.id)))
    .returning();

  if (!quest) {
    res.status(404).json({ error: "Quest not found" });
    return;
  }

  res.json(UpdateQuestResponse.parse(questToResponse(quest)));
});

router.delete("/quests/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const params = DeleteQuestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(questsTable)
    .where(and(eq(questsTable.id, params.data.id), eq(questsTable.userId, user.id)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Quest not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/quests/:id/progress", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const params = LogQuestProgressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = LogQuestProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(questsTable)
    .where(and(eq(questsTable.id, params.data.id), eq(questsTable.userId, user.id)));

  if (!existing) {
    res.status(404).json({ error: "Quest not found" });
    return;
  }

  const newAmount = parseFloat(existing.currentAmount as string) + parsed.data.amount;
  const targetAmount = existing.targetAmount ? parseFloat(existing.targetAmount as string) : null;
  const completed = targetAmount !== null && newAmount >= targetAmount;

  const [updated] = await db
    .update(questsTable)
    .set({ currentAmount: String(newAmount), completed })
    .where(eq(questsTable.id, existing.id))
    .returning();

  res.json(LogQuestProgressResponse.parse(questToResponse(updated)));
});

export default router;
