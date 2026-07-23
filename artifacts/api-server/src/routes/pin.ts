import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createClerkClient } from "@clerk/express";
import { requireAuth } from "../middlewares/auth";
import { SetPinBody, ChangePinBody, DeletePinBody, PinLoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

function clerkClient() {
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
}

// ── GET /api/users/me/pin-status ─────────────────────────────────────────────
router.get("/users/me/pin-status", requireAuth, (req, res): void => {
  const user = (req as any).dbUser;
  res.json({ hasPinSet: !!user.pinHash });
});

// ── POST /api/users/me/pin — set PIN for the first time ─────────────────────
router.post("/users/me/pin", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  if (user.pinHash) {
    res.status(409).json({ error: "PIN already set. Use PUT to change it." });
    return;
  }

  const parsed = SetPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid request." });
    return;
  }

  const pinHash = await bcrypt.hash(parsed.data.pin, 12);
  await db.update(usersTable).set({ pinHash }).where(eq(usersTable.id, user.id));
  res.json({ success: true });
});

// ── PUT /api/users/me/pin — change PIN ──────────────────────────────────────
router.put("/users/me/pin", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  if (!user.pinHash) {
    res.status(400).json({ error: "No PIN set. Use POST to set one first." });
    return;
  }

  const parsed = ChangePinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid request." });
    return;
  }

  const match = await bcrypt.compare(parsed.data.currentPin, user.pinHash);
  if (!match) {
    res.status(401).json({ error: "Current PIN is incorrect." });
    return;
  }

  const pinHash = await bcrypt.hash(parsed.data.newPin, 12);
  await db.update(usersTable).set({ pinHash }).where(eq(usersTable.id, user.id));
  res.json({ success: true });
});

// ── DELETE /api/users/me/pin — remove PIN ───────────────────────────────────
router.delete("/users/me/pin", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  if (!user.pinHash) {
    res.status(400).json({ error: "No PIN is set." });
    return;
  }

  const parsed = DeletePinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid request." });
    return;
  }

  const match = await bcrypt.compare(parsed.data.pin, user.pinHash);
  if (!match) {
    res.status(401).json({ error: "PIN is incorrect." });
    return;
  }

  await db.update(usersTable).set({ pinHash: null }).where(eq(usersTable.id, user.id));
  res.json({ success: true });
});

// ── POST /api/auth/pin-login — verify PIN and return Clerk sign-in token ────
// No auth required — this is the login endpoint
router.post("/auth/pin-login", async (req, res): Promise<void> => {
  const parsed = PinLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid request." });
    return;
  }

  try {
    // Find the Clerk user by email address
    const clerk = clerkClient();
    const { data: clerkUsers } = await clerk.users.getUserList({
      emailAddress: [parsed.data.email],
      limit: 1,
    });

    if (!clerkUsers.length) {
      res.status(401).json({ error: "Invalid email or PIN." });
      return;
    }

    const clerkUser = clerkUsers[0];

    // Look up local user record
    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkUser.id));

    if (!dbUser || !dbUser.pinHash) {
      res.status(401).json({ error: "Invalid email or PIN." });
      return;
    }

    const match = await bcrypt.compare(parsed.data.pin, dbUser.pinHash);
    if (!match) {
      res.status(401).json({ error: "Invalid email or PIN." });
      return;
    }

    // Issue a Clerk sign-in token (valid for 2 minutes)
    const tokenObj = await clerk.signInTokens.createSignInToken({
      userId: clerkUser.id,
      expiresInSeconds: 120,
    });

    res.json({ token: tokenObj.token });
  } catch (err) {
    console.error("PIN login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
