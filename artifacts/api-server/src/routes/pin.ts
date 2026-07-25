import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
// otplib and qrcode are CJS-only packages externalised from the esbuild bundle;
// they load correctly at runtime via the globalThis.require shim.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticator } = require("otplib") as typeof import("otplib");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require("qrcode") as typeof import("qrcode");
import { createClerkClient } from "@clerk/express";
import { requireAuth } from "../middlewares/auth";
import { SetPinBody, ChangePinBody, DeletePinBody, PinLoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

const APP_NAME = "Wealth Leveling";

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

// ── GET /api/auth/totp/status — is TOTP enabled for the authenticated user ──
router.get("/auth/totp/status", requireAuth, (req, res): void => {
  const user = (req as any).dbUser;
  res.json({ totpEnabled: !!user.totpEnabled });
});

// ── POST /api/auth/totp/setup — generate a new TOTP secret + QR code ────────
// Stores the secret (unverified) in the DB.  It is not "active" until /enable.
router.post("/auth/totp/setup", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;
  const clerkUser = (req as any).auth?.userId;

  // Look up the email for the QR label
  const clerk = clerkClient();
  const clerkUserObj = await clerk.users.getUser(clerkUser);
  const email = clerkUserObj.primaryEmailAddress?.emailAddress ?? "user";

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, APP_NAME, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  // Store pending secret; totpEnabled stays false until verified
  await db.update(usersTable)
    .set({ totpSecret: secret, totpEnabled: false })
    .where(eq(usersTable.id, user.id));

  res.json({ qrDataUrl, secret });
});

// ── POST /api/auth/totp/enable — verify a code and activate TOTP ────────────
router.post("/auth/totp/enable", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;

  const code: string | undefined = req.body?.code;
  if (!code || !/^\d{6}$/.test(code)) {
    res.status(400).json({ error: "Provide a 6-digit authenticator code." });
    return;
  }

  if (!user.totpSecret) {
    res.status(400).json({ error: "No TOTP secret found. Call /setup first." });
    return;
  }

  const isValid = authenticator.verify({ token: code, secret: user.totpSecret });
  if (!isValid) {
    res.status(401).json({ error: "Authenticator code is incorrect. Try again." });
    return;
  }

  await db.update(usersTable)
    .set({ totpEnabled: true })
    .where(eq(usersTable.id, user.id));

  res.json({ success: true });
});

// ── DELETE /api/auth/totp/disable — disable TOTP (requires valid code) ──────
router.delete("/auth/totp/disable", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;

  if (!user.totpEnabled) {
    res.status(400).json({ error: "TOTP is not enabled." });
    return;
  }

  const code: string | undefined = req.body?.code;
  if (!code || !/^\d{6}$/.test(code)) {
    res.status(400).json({ error: "Provide your 6-digit authenticator code to disable 2FA." });
    return;
  }

  const isValid = authenticator.verify({ token: code, secret: user.totpSecret! });
  if (!isValid) {
    res.status(401).json({ error: "Authenticator code is incorrect." });
    return;
  }

  await db.update(usersTable)
    .set({ totpEnabled: false, totpSecret: null })
    .where(eq(usersTable.id, user.id));

  res.json({ success: true });
});

// ── POST /api/auth/pin-login — verify PIN (+ TOTP if enabled) ──────────────
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

    // Verify PIN
    const match = await bcrypt.compare(parsed.data.pin, dbUser.pinHash);
    if (!match) {
      res.status(401).json({ error: "Invalid email or PIN." });
      return;
    }

    // If TOTP is enabled, require a valid TOTP code
    if (dbUser.totpEnabled) {
      if (!parsed.data.totpCode) {
        // PIN was correct — signal that TOTP is required next
        res.json({ requiresTotp: true });
        return;
      }

      const totpValid = authenticator.verify({
        token: parsed.data.totpCode,
        secret: dbUser.totpSecret!,
      });

      if (!totpValid) {
        res.status(401).json({ error: "Authenticator code is incorrect or expired." });
        return;
      }
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
