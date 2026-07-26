import { Router, type IRouter } from "express";
import { db, budgetsTable, budgetItemsTable, transactionsTable, wealthTable, wealthAssetsTable, dashboardsTable } from "@workspace/db";
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

const UpdateTxBody = CreateTxBody.partial().refine(
  (d) => Object.values(d).some((v) => v !== undefined),
  { message: "At least one field must be provided" }
);

const TxIdParams = z.object({ id: z.coerce.number().int().positive() });

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
  const idParsed = TxIdParams.safeParse(req.params);
  if (!idParsed.success) { res.status(400).json({ error: idParsed.error.message }); return; }
  const txId = idParsed.data.id;

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
  const idParsed = TxIdParams.safeParse(req.params);
  if (!idParsed.success) { res.status(400).json({ error: idParsed.error.message }); return; }
  const txId = idParsed.data.id;

  const { budget } = await getOrCreateBudget(user.id);

  const [existing] = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.id, txId), eq(transactionsTable.budgetId, budget.id)));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(transactionsTable).where(eq(transactionsTable.id, txId));
  res.json({ success: true });
});

// ── GET /api/budget/analytics?year=YYYY ──────────────────────────────────────
router.get("/budget/analytics", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const year = parseInt(typeof req.query.year === "string" ? req.query.year : String(new Date().getFullYear()), 10);
  if (isNaN(year)) { res.status(400).json({ error: "Invalid year" }); return; }

  const { budget } = await getOrCreateBudget(user.id);

  const start = `${year}-01-01`;
  const end   = `${year}-12-31`;

  const rows = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.budgetId, budget.id), gte(transactionsTable.date, start), lte(transactionsTable.date, end)));

  // Aggregate by month
  const byMonth: Record<string, { income: number; expense: number; txCount: number }> = {};
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    byMonth[key] = { income: 0, expense: 0, txCount: 0 };
  }
  for (const tx of rows) {
    const key = tx.date.slice(0, 7);
    if (!byMonth[key]) continue;
    const amount = parseFloat(tx.amount as string);
    if (tx.type === "income") byMonth[key].income += amount;
    else byMonth[key].expense += amount;
    byMonth[key].txCount++;
  }

  const months = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({ month, ...d, reserves: d.income - d.expense }));

  const totals = months.reduce(
    (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense, reserves: acc.reserves + m.reserves }),
    { income: 0, expense: 0, reserves: 0 }
  );

  const monthsWithData = months.filter(m => m.txCount > 0).length;
  const factor = monthsWithData > 0 ? 12 / monthsWithData : 0;
  const projection = {
    annualIncome:   Math.round(totals.income   * factor),
    annualExpense:  Math.round(totals.expense  * factor),
    annualReserves: Math.round(totals.reserves * factor),
  };

  res.json({ year, months, totals, projection });
});

// ── POST /api/budget/sync-wealth ──────────────────────────────────────────────
// Computes cumulative budget surplus from all transactions and upserts it as a
// "Budget Savings" CASH asset in the wealth table, then recomputes net worth.
router.post("/budget/sync-wealth", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const { budget } = await getOrCreateBudget(user.id);

  // Sum all income and expense transactions ever
  const allTx = await db.select().from(transactionsTable).where(eq(transactionsTable.budgetId, budget.id));
  let totalIncome = 0, totalExpense = 0;
  for (const tx of allTx) {
    const amount = parseFloat(tx.amount as string);
    if (tx.type === "income") totalIncome += amount;
    else totalExpense += amount;
  }
  const surplus = parseFloat((totalIncome - totalExpense).toFixed(2));

  // Get or create wealth record
  let [wealth] = await db.select().from(wealthTable).where(eq(wealthTable.userId, user.id));
  if (!wealth) {
    [wealth] = await db.insert(wealthTable).values({ userId: user.id }).returning();
  }

  // Find existing "Budget Savings" asset
  const assets = await db.select().from(wealthAssetsTable).where(eq(wealthAssetsTable.wealthId, wealth.id));
  const existing = assets.find(a => a.label === "Budget Savings");

  let assetId: number;
  if (existing) {
    await db.update(wealthAssetsTable).set({ amount: String(surplus) }).where(eq(wealthAssetsTable.id, existing.id));
    assetId = existing.id;
  } else {
    const [created] = await db.insert(wealthAssetsTable).values({
      wealthId: wealth.id, label: "Budget Savings", amount: String(surplus), category: "CASH",
    }).returning();
    assetId = created.id;
  }

  // Recompute total net worth from all assets
  const updatedAssets = await db.select().from(wealthAssetsTable).where(eq(wealthAssetsTable.wealthId, wealth.id));
  const newNetWorth = updatedAssets.reduce((s, a) => s + parseFloat(a.amount as string), 0);
  const [updatedWealth] = await db
    .update(wealthTable)
    .set({ netWorth: String(newNetWorth) })
    .where(eq(wealthTable.id, wealth.id))
    .returning();

  // Also sync net worth to dashboard snapshot
  await db.update(dashboardsTable)
    .set({ netWorth: String(newNetWorth), totalAssets: String(newNetWorth) })
    .where(eq(dashboardsTable.userId, user.id));

  // Compute budget adherence for PER stat context (returned but not auto-applied)
  const items = await db.select().from(budgetItemsTable).where(eq(budgetItemsTable.budgetId, budget.id));
  const totalPlanned = items.reduce((s, i) => s + parseFloat(i.planned as string), 0);

  // Current month actual expense
  const now = new Date().toISOString().slice(0, 7);
  const monthStart = `${now}-01`;
  const monthEnd   = `${now}-31`;
  const monthTx = await db.select().from(transactionsTable)
    .where(and(eq(transactionsTable.budgetId, budget.id), gte(transactionsTable.date, monthStart), lte(transactionsTable.date, monthEnd)));
  const monthExpense = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount as string), 0);
  const budgetAdherence = totalPlanned > 0 ? Math.min(100, Math.round((1 - Math.max(0, monthExpense - totalPlanned) / totalPlanned) * 100)) : 100;

  res.json({
    synced: surplus,
    newNetWorth: parseFloat(updatedWealth.netWorth as string),
    assetId,
    budgetAdherence,
    totalIncome,
    totalExpense,
  });
});

export default router;
