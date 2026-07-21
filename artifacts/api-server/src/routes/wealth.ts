import { Router, type IRouter } from "express";
import { db, wealthTable, wealthAssetsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { GetWealthResponse, UpdateWealthBody, UpdateWealthResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateWealth(userId: number) {
  let [wealth] = await db.select().from(wealthTable).where(eq(wealthTable.userId, userId));
  if (!wealth) {
    [wealth] = await db.insert(wealthTable).values({ userId }).returning();
  }
  const assets = await db.select().from(wealthAssetsTable).where(eq(wealthAssetsTable.wealthId, wealth.id));
  return { wealth, assets };
}

function wealthToResponse(wealth: typeof wealthTable.$inferSelect, assets: typeof wealthAssetsTable.$inferSelect[]) {
  return {
    id: wealth.id,
    userId: wealth.userId,
    netWorth: parseFloat(wealth.netWorth as string),
    assets: assets.map(a => ({
      id: a.id,
      label: a.label,
      amount: parseFloat(a.amount as string),
      category: a.category as "STOCKS" | "MUTUAL_FUNDS" | "REAL_ESTATE" | "CASH" | "CRYPTO" | "OTHER",
    })),
    updatedAt: wealth.updatedAt.toISOString(),
  };
}

router.get("/wealth", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const { wealth, assets } = await getOrCreateWealth(user.id);
  res.json(GetWealthResponse.parse(wealthToResponse(wealth, assets)));
});

router.patch("/wealth", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const parsed = UpdateWealthBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { wealth } = await getOrCreateWealth(user.id);
  const updates: Record<string, unknown> = {};
  if (parsed.data.netWorth !== undefined) updates.netWorth = String(parsed.data.netWorth);

  const [updatedWealth] = await db
    .update(wealthTable)
    .set(updates)
    .where(eq(wealthTable.id, wealth.id))
    .returning();

  if (parsed.data.assets !== undefined) {
    await db.delete(wealthAssetsTable).where(eq(wealthAssetsTable.wealthId, wealth.id));
    if (parsed.data.assets.length > 0) {
      await db.insert(wealthAssetsTable).values(
        parsed.data.assets.map(a => ({
          wealthId: wealth.id,
          label: a.label,
          amount: String(a.amount),
          category: a.category,
        }))
      );
    }
    // Recompute net worth from assets if assets provided
    const totalAssets = parsed.data.assets.reduce((sum, a) => sum + a.amount, 0);
    if (parsed.data.netWorth === undefined) {
      await db.update(wealthTable).set({ netWorth: String(totalAssets) }).where(eq(wealthTable.id, wealth.id));
      updatedWealth.netWorth = String(totalAssets) as any;
    }
  }

  const newAssets = await db.select().from(wealthAssetsTable).where(eq(wealthAssetsTable.wealthId, wealth.id));
  res.json(UpdateWealthResponse.parse(wealthToResponse(updatedWealth, newAssets)));
});

export default router;
