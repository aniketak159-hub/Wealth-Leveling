import { Router, type IRouter } from "express";
import { db, budgetsTable, budgetItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { GetBudgetResponse, UpdateBudgetBody, UpdateBudgetResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateBudget(userId: number) {
  let [budget] = await db.select().from(budgetsTable).where(eq(budgetsTable.userId, userId));
  if (!budget) {
    [budget] = await db.insert(budgetsTable).values({ userId }).returning();
  }
  const items = await db.select().from(budgetItemsTable).where(eq(budgetItemsTable.budgetId, budget.id));
  return { budget, items };
}

function budgetToResponse(budget: typeof budgetsTable.$inferSelect, items: typeof budgetItemsTable.$inferSelect[]) {
  return {
    id: budget.id,
    userId: budget.userId,
    monthlyIncome: parseFloat(budget.monthlyIncome as string),
    items: items.map(i => ({
      id: i.id,
      label: i.label,
      planned: parseFloat(i.planned as string),
      actual: parseFloat(i.actual as string),
    })),
    updatedAt: budget.updatedAt.toISOString(),
  };
}

router.get("/budget", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const { budget, items } = await getOrCreateBudget(user.id);
  res.json(GetBudgetResponse.parse(budgetToResponse(budget, items)));
});

router.patch("/budget", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const parsed = UpdateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { budget } = await getOrCreateBudget(user.id);
  const updates: Record<string, unknown> = {};
  if (parsed.data.monthlyIncome !== undefined) updates.monthlyIncome = String(parsed.data.monthlyIncome);

  const [updatedBudget] = await db
    .update(budgetsTable)
    .set(updates)
    .where(eq(budgetsTable.id, budget.id))
    .returning();

  if (parsed.data.items !== undefined) {
    await db.delete(budgetItemsTable).where(eq(budgetItemsTable.budgetId, budget.id));
    if (parsed.data.items.length > 0) {
      await db.insert(budgetItemsTable).values(
        parsed.data.items.map((item, idx) => ({
          budgetId: budget.id,
          label: item.label,
          planned: String(item.planned),
          actual: String(item.actual),
          sortOrder: idx,
        }))
      );
    }
  }

  const newItems = await db.select().from(budgetItemsTable).where(eq(budgetItemsTable.budgetId, budget.id));
  res.json(UpdateBudgetResponse.parse(budgetToResponse(updatedBudget, newItems)));
});

export default router;
