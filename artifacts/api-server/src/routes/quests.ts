import { Router, type IRouter } from "express";
import { db, questsTable, wealthTable, budgetsTable, budgetItemsTable } from "@workspace/db";
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

type DataLink = "NET_WORTH" | "MONTHLY_SAVINGS" | "TOTAL_EXPENSES" | null;

function questToResponse(q: typeof questsTable.$inferSelect, liveAmount?: number) {
  return {
    id: q.id,
    userId: q.userId,
    title: q.title,
    description: q.description ?? null,
    category: q.category as "SYSTEM" | "SELF",
    targetAmount: q.targetAmount ? parseFloat(q.targetAmount as string) : null,
    currentAmount: liveAmount !== undefined ? liveAmount : parseFloat(q.currentAmount as string),
    xpReward: q.xpReward,
    frequency: q.frequency as "DAILY" | "WEEKLY" | "MONTHLY" | "ONGOING",
    completed: q.completed,
    completedAt: q.completedAt?.toISOString() ?? null,
    dataLink: (q.dataLink as DataLink) ?? null,
    createdAt: q.createdAt.toISOString(),
  };
}

/** Fetch the live financial value for a dataLink type */
async function getLiveAmount(userId: number, dataLink: string): Promise<number> {
  if (dataLink === "NET_WORTH") {
    const [row] = await db.select().from(wealthTable).where(eq(wealthTable.userId, userId));
    return row ? parseFloat(row.netWorth as string) : 0;
  }

  if (dataLink === "MONTHLY_SAVINGS" || dataLink === "TOTAL_EXPENSES") {
    const [budget] = await db.select().from(budgetsTable).where(eq(budgetsTable.userId, userId));
    if (!budget) return 0;
    const items = await db.select().from(budgetItemsTable).where(eq(budgetItemsTable.budgetId, budget.id));
    const totalExpenses = items.reduce((sum, item) => sum + parseFloat(item.actual as string), 0);
    if (dataLink === "TOTAL_EXPENSES") return totalExpenses;
    // MONTHLY_SAVINGS = income - expenses
    const income = parseFloat(budget.monthlyIncome as string);
    return Math.max(0, income - totalExpenses);
  }

  return 0;
}

router.get("/quests", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const quests = await db.select().from(questsTable).where(eq(questsTable.userId, user.id));

  // For quests with a dataLink, auto-compute currentAmount from financial data
  const linkedLinks = [...new Set(quests.filter(q => q.dataLink).map(q => q.dataLink!))];
  const liveValues: Record<string, number> = {};
  await Promise.all(
    linkedLinks.map(async (link) => {
      liveValues[link] = await getLiveAmount(user.id, link);
    })
  );

  const responses = quests.map(q => {
    const live = q.dataLink ? liveValues[q.dataLink] : undefined;
    return questToResponse(q, live);
  });

  res.json(ListQuestsResponse.parse(responses));
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
      xpReward: parsed.data.xpReward ?? 100,
      frequency: parsed.data.frequency ?? "ONGOING",
      dataLink: parsed.data.dataLink ?? null,
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
  if (parsed.data.completed !== undefined) {
    updates.completed = parsed.data.completed;
    // Auto-stamp completedAt when marking complete
    updates.completedAt = parsed.data.completed ? new Date() : null;
  }
  if (parsed.data.completedAt !== undefined) {
    updates.completedAt = parsed.data.completedAt ? new Date(parsed.data.completedAt) : null;
  }

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
  const nowCompleted = targetAmount !== null && newAmount >= targetAmount;

  const setValues: Record<string, unknown> = {
    currentAmount: String(newAmount),
    completed: nowCompleted,
  };
  if (nowCompleted && !existing.completed) {
    setValues.completedAt = new Date();
  }

  const [updated] = await db
    .update(questsTable)
    .set(setValues)
    .where(eq(questsTable.id, existing.id))
    .returning();

  res.json(LogQuestProgressResponse.parse(questToResponse(updated)));
});

export default router;
