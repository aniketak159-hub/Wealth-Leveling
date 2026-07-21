import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { GetMeResponse, UpdateMeBody, UpdateMeResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  res.json(GetMeResponse.parse({
    id: user.id,
    clerkId: user.clerkId,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
  }));
});

router.patch("/users/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json(UpdateMeResponse.parse({
    id: updated.id,
    clerkId: updated.clerkId,
    displayName: updated.displayName,
    avatarUrl: updated.avatarUrl ?? null,
    isAdmin: updated.isAdmin,
    createdAt: updated.createdAt.toISOString(),
  }));
});

export default router;
