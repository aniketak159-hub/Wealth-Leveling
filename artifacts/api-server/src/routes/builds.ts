import { Router, type IRouter } from "express";
import { db, buildsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import {
  ListBuildsResponse,
  CreateBuildBody,
  CreateBuildResponse,
  UpdateBuildParams,
  UpdateBuildBody,
  UpdateBuildResponse,
  DeleteBuildParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildToResponse(b: typeof buildsTable.$inferSelect) {
  const revenue = parseFloat(b.revenue as string);
  const expenses = parseFloat(b.expenses as string);
  return {
    id: b.id,
    userId: b.userId,
    name: b.name,
    description: b.description,
    rank: b.rank as "S" | "A" | "B" | "C" | "D" | "E",
    revenue,
    expenses,
    netProfit: revenue - expenses,
    createdAt: b.createdAt.toISOString(),
  };
}

router.get("/builds", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const builds = await db.select().from(buildsTable).where(eq(buildsTable.userId, user.id));
  res.json(ListBuildsResponse.parse(builds.map(buildToResponse)));
});

router.post("/builds", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const parsed = CreateBuildBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [build] = await db
    .insert(buildsTable)
    .values({
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      rank: parsed.data.rank ?? "D",
      revenue: parsed.data.revenue ? String(parsed.data.revenue) : "0",
      expenses: parsed.data.expenses ? String(parsed.data.expenses) : "0",
    })
    .returning();

  res.status(201).json(CreateBuildResponse.parse(buildToResponse(build)));
});

router.patch("/builds/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const params = UpdateBuildParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBuildBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.rank !== undefined) updates.rank = parsed.data.rank;
  if (parsed.data.revenue !== undefined) updates.revenue = String(parsed.data.revenue);
  if (parsed.data.expenses !== undefined) updates.expenses = String(parsed.data.expenses);

  const [build] = await db
    .update(buildsTable)
    .set(updates)
    .where(and(eq(buildsTable.id, params.data.id), eq(buildsTable.userId, user.id)))
    .returning();

  if (!build) {
    res.status(404).json({ error: "Build not found" });
    return;
  }

  res.json(UpdateBuildResponse.parse(buildToResponse(build)));
});

router.delete("/builds/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const params = DeleteBuildParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(buildsTable)
    .where(and(eq(buildsTable.id, params.data.id), eq(buildsTable.userId, user.id)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Build not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
