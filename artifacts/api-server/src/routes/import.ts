import { Router, type IRouter } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/auth";
import { parseStatement } from "../lib/statement-parser";
import { db, budgetsTable, budgetItemsTable, wealthTable, wealthAssetsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

// Store uploads in memory — we parse immediately and discard the buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "text/csv", "text/plain", "application/octet-stream"];
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    if (allowed.includes(file.mimetype) || ext === "csv" || ext === "pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and CSV files are accepted."));
    }
  },
});

// ─── POST /import/parse ───────────────────────────────────────────────────────
// Parse a bank statement file and return categorised suggestions.
// No database writes — preview only.

router.post(
  "/import/parse",
  requireAuth,
  upload.single("statement"),
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded. Send a PDF or CSV as 'statement'." });
      return;
    }

    try {
      const result = await parseStatement(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
      );
      res.json(result);
    } catch (err) {
      res.status(422).json({
        error: "Failed to parse statement.",
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  },
);

// ─── POST /import/apply ───────────────────────────────────────────────────────
// Apply confirmed budget items and/or wealth assets after the user reviews
// the parsed preview. This does the actual database writes.

const ApplyBody = z.object({
  budget: z
    .object({
      monthlyIncome: z.number().optional(),
      items: z
        .array(
          z.object({
            label: z.string(),
            planned: z.number(),
            actual: z.number(),
          }),
        )
        .optional(),
    })
    .optional(),
  wealth: z
    .object({
      assets: z
        .array(
          z.object({
            label: z.string(),
            amount: z.number(),
            category: z.enum(["STOCKS", "MUTUAL_FUNDS", "REAL_ESTATE", "CASH", "CRYPTO", "OTHER"]),
          }),
        )
        .optional(),
    })
    .optional(),
});

router.post("/import/apply", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const parsed = ApplyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { budget, wealth } = parsed.data;
  const result: Record<string, unknown> = {};

  // ── Apply budget ────────────────────────────────────────────────────────────
  if (budget) {
    let [b] = await db.select().from(budgetsTable).where(eq(budgetsTable.userId, user.id));
    if (!b) {
      [b] = await db.insert(budgetsTable).values({ userId: user.id }).returning();
    }

    if (budget.monthlyIncome !== undefined) {
      await db
        .update(budgetsTable)
        .set({ monthlyIncome: String(budget.monthlyIncome) })
        .where(eq(budgetsTable.id, b.id));
    }

    if (budget.items && budget.items.length > 0) {
      // Replace all items (same strategy as PATCH /budget)
      await db.delete(budgetItemsTable).where(eq(budgetItemsTable.budgetId, b.id));
      await db.insert(budgetItemsTable).values(
        budget.items.map((item, idx) => ({
          budgetId: b.id,
          label: item.label,
          planned: String(item.planned),
          actual: String(item.actual),
          sortOrder: idx,
        })),
      );
    }

    const items = await db
      .select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.budgetId, b.id));
    const [freshBudget] = await db.select().from(budgetsTable).where(eq(budgetsTable.id, b.id));
    result.budget = {
      id: freshBudget.id,
      monthlyIncome: parseFloat(freshBudget.monthlyIncome as string),
      items: items.map((i) => ({
        id: i.id,
        label: i.label,
        planned: parseFloat(i.planned as string),
        actual: parseFloat(i.actual as string),
      })),
    };
  }

  // ── Apply wealth assets ─────────────────────────────────────────────────────
  if (wealth?.assets && wealth.assets.length > 0) {
    let [w] = await db.select().from(wealthTable).where(eq(wealthTable.userId, user.id));
    if (!w) {
      [w] = await db.insert(wealthTable).values({ userId: user.id }).returning();
    }

    // Merge: keep existing assets, add/update imported ones by label
    const existing = await db
      .select()
      .from(wealthAssetsTable)
      .where(eq(wealthAssetsTable.wealthId, w.id));

    for (const asset of wealth.assets) {
      const match = existing.find(
        (e) => e.label.toLowerCase() === asset.label.toLowerCase(),
      );
      if (match) {
        await db
          .update(wealthAssetsTable)
          .set({ amount: String(asset.amount), category: asset.category })
          .where(eq(wealthAssetsTable.id, match.id));
      } else {
        await db.insert(wealthAssetsTable).values({
          wealthId: w.id,
          label: asset.label,
          amount: String(asset.amount),
          category: asset.category,
        });
      }
    }

    // Recompute net worth
    const allAssets = await db
      .select()
      .from(wealthAssetsTable)
      .where(eq(wealthAssetsTable.wealthId, w.id));
    const netWorth = allAssets.reduce((s, a) => s + parseFloat(a.amount as string), 0);
    await db
      .update(wealthTable)
      .set({ netWorth: String(netWorth) })
      .where(eq(wealthTable.id, w.id));

    result.wealth = {
      netWorth,
      assets: allAssets.map((a) => ({
        id: a.id,
        label: a.label,
        amount: parseFloat(a.amount as string),
        category: a.category,
      })),
    };
  }

  res.json({ ok: true, ...result });
});

export default router;
