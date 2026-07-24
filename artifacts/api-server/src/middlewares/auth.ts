import { getAuth, createClerkClient } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

function getClerkClient() {
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
}

async function resolveDisplayName(clerkId: string): Promise<string> {
  try {
    const clerk = getClerkClient();
    const clerkUser = await clerk.users.getUser(clerkId);
    const name = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return (
      name ||
      clerkUser.username ||
      clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
      "Player"
    );
  } catch {
    return "Player";
  }
}

// Attach the local DB user to req.dbUser, JIT-provisioning if needed
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let user: typeof usersTable.$inferSelect | undefined;

  try {
    [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));

    if (!user) {
      // New user — fetch real name from Clerk
      const displayName = await resolveDisplayName(clerkId);
      [user] = await db
        .insert(usersTable)
        .values({ clerkId, displayName })
        .returning();
    } else if (user.displayName === "Hunter" || user.displayName === "Player") {
      // Existing user with a placeholder name — backfill from Clerk
      const displayName = await resolveDisplayName(clerkId);
      if (displayName !== user.displayName) {
        [user] = await db
          .update(usersTable)
          .set({ displayName })
          .where(eq(usersTable.clerkId, clerkId))
          .returning();
      }
    }
  } catch (err) {
    // DB unreachable or query failure — don't leak internals
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[requireAuth] DB error for clerkId=%s: %s", clerkId, msg);
    res.status(503).json({ error: "Service temporarily unavailable. Please try again shortly." });
    return;
  }

  if (!user) {
    // Extremely unlikely: insert returned nothing (e.g. race with delete)
    res.status(503).json({ error: "Could not provision user record. Please try again." });
    return;
  }

  (req as any).dbUser = user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = (req as any).dbUser;
  if (!user?.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
