import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createClerkClient } from "@clerk/express";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function clerkClient() {
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
}

const PIN_REGEX = /^\d{4,6}$/;

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
  const { pin } = req.body;
  if (!pin || !PIN_REGEX.test(String(pin))) {
    res.status(400).json({ error: "PIN must be 4–6 digits." });
    return;
  }
  const pinHash = await bcrypt.hash(String(pin), 12);
  await db.update(usersTable).set({ pinHash }).where(eq(usersTable.id, user.id));
  res.json({ success: true });
});

// ── PUT /api/users/me/pin — change PIN ──────────────────────────────────────
router.put("/users/me/pin", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const { currentPin, newPin } = req.body;
  if (!user.pinHash) {
    res.status(400).json({ error: "No PIN set. Use POST to set one first." });
    return;
  }
  if (!currentPin || !newPin) {
    res.status(400).json({ error: "currentPin and newPin are required." });
    return;
  }
  if (!PIN_REGEX.test(String(newPin))) {
    res.status(400).json({ error: "New PIN must be 4–6 digits." });
    return;
  }
  const match = await bcrypt.compare(String(currentPin), user.pinHash);
  if (!match) {
    res.status(401).json({ error: "Current PIN is incorrect." });
    return;
  }
  const pinHash = await bcrypt.hash(String(newPin), 12);
  await db.update(usersTable).set({ pinHash }).where(eq(usersTable.id, user.id));
  res.json({ success: true });
});

// ── DELETE /api/users/me/pin — remove PIN ───────────────────────────────────
router.delete("/users/me/pin", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const { pin } = req.body;
  if (!user.pinHash) {
    res.status(400).json({ error: "No PIN is set." });
    return;
  }
  if (!pin) {
    res.status(400).json({ error: "Current PIN is required to remove it." });
    return;
  }
  const match = await bcrypt.compare(String(pin), user.pinHash);
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
  const { email, pin } = req.body;
  if (!email || !pin) {
    res.status(400).json({ error: "email and pin are required." });
    return;
  }

  try {
    // Find the Clerk user by email address
    const clerk = clerkClient();
    const { data: clerkUsers } = await clerk.users.getUserList({
      emailAddress: [String(email)],
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

    const match = await bcrypt.compare(String(pin), dbUser.pinHash);
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
