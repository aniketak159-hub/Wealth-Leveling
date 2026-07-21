import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Attach the local DB user to req.dbUser, JIT-provisioning if needed
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // JIT provision user in local DB
  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user) {
    const displayName =
      (auth as any)?.sessionClaims?.fullName ||
      (auth as any)?.sessionClaims?.firstName ||
      "Hunter";
    [user] = await db
      .insert(usersTable)
      .values({ clerkId, displayName })
      .returning();
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
