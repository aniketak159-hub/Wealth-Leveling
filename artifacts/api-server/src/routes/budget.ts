import { Router, type IRouter } from "express";
import { db, budgetsTable, budgetItemsTable, transactionsTable } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { GetBudgetResponse, UpdateBudgetBody, UpdateBudgetResponse } from "@workspace/api-zod";
import { z } from "zod";

const router: IRouter = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function txToResponse(tx: typeof transactionsTable.$inferSelect) {
  return {
    id: tx.id,
    budgetId: tx.budgetId,
    type: tx.type,
    category: tx.category,
    description: tx.description,
    amount: parseFloat(tx.amount as string),
    date: tx.date,
    createdAt: tx.createdAt.toISOString(),
  };
}

// ── GET /api/budget ───────────────────────────────────────────────────────────
router.get("/budget", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const { budget, items } = await getOrCreateBudget(user.id);
  res.json(GetBudgetResponse.parse(budgetToResponse(budget, items)));
});

// ── PATCH /api/budget ─────────────────────────────────────────────────────────
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

  const updatedBudget =
    Object.keys(updates).length > 0
      ? (await db.update(budgetsTable).set(updates).where(eq(budgetsTable.id, budget.id)).returning())[0]
      : budget;

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

// ── Zod schemas for transactions ──────────────────────────────────────────────
const CreateTxBody = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  description: z.string().default(""),
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const UpdateTxBody = CreateTxBody.partial();

// ── GET /api/budget/transactions ──────────────────────────────────────────────
// Optional query: ?month=YYYY-MM  filters to that calendar month
router.get("/budget/transactions", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const { budget } = await getOrCreateBudget(user.id);

  const month = typeof req.query.month === "string" ? req.query.month : null;

  let rows;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const start = `${month}-01`;
    const end = `${month}-31`;
    rows = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.budgetId, budget.id),
          gte(transactionsTable.date, start),
          lte(transactionsTable.date, end)
        )
      )
      .orderBy(desc(transactionsTable.date));
  } else {
    rows = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.budgetId, budget.id))
      .orderBy(desc(transactionsTable.date));
  }

  res.json(rows.map(txToResponse));
});

// ── POST /api/budget/transactions ─────────────────────────────────────────────
router.post("/budget/transactions", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const parsed = CreateTxBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { budget } = await getOrCreateBudget(user.id);

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      budgetId: budget.id,
      type: parsed.data.type,
      category: parsed.data.category,
      description: parsed.data.description,
      amount: String(parsed.data.amount),
      date: parsed.data.date,
    })
    .returning();

  res.status(201).json(txToResponse(tx));
});

// ── PATCH /api/budget/transactions/:id ────────────────────────────────────────
router.patch("/budget/transactions/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const txId = parseInt(req.params.id, 10);
  if (isNaN(txId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateTxBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { budget } = await getOrCreateBudget(user.id);

  // Verify ownership
  const [existing] = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.id, txId), eq(transactionsTable.budgetId, budget.id)));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.type !== undefined) updates.type = parsed.data.type;
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.amount !== undefined) updates.amount = String(parsed.data.amount);
  if (parsed.data.date !== undefined) updates.date = parsed.data.date;

  const [updated] = await db
    .update(transactionsTable)
    .set(updates)
    .where(eq(transactionsTable.id, txId))
    .returning();

  res.json(txToResponse(updated));
});

// ── DELETE /api/budget/transactions/:id ───────────────────────────────────────
router.delete("/budget/transactions/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const txId = parseInt(req.params.id, 10);
  if (isNaN(txId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { budget } = await getOrCreateBudget(user.id);

  const [existing] = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.id, txId), eq(transactionsTable.budgetId, budget.id)));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(transactionsTable).where(eq(transactionsTable.id, txId));
  res.json({ success: true });
});

export default router;
