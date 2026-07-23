/**
 * Dashboard route tests — confirms the dashboard returns all fields the
 * frontend depends on, so a silent API change can't break the UI.
 */
import { describe, it, expect, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import { getAuth } from "@clerk/express";
import { db, usersTable, dashboardsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import app from "../app";

const TEST_CLERK_ID = "test_clerk_dashboard_vitest";

const mockGetAuth = vi.mocked(getAuth);

beforeEach(() => {
  mockGetAuth.mockReturnValue({ userId: TEST_CLERK_ID } as any);
});

afterAll(async () => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, TEST_CLERK_ID));
  if (user) {
    await db
      .delete(dashboardsTable)
      .where(eq(dashboardsTable.userId, user.id));
    await db.delete(usersTable).where(eq(usersTable.id, user.id));
  }
});

describe("GET /api/dashboard", () => {
  it("returns 200 with all required dashboard fields", async () => {
    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: expect.any(Number),
      userId: expect.any(Number),
      displayName: expect.any(String),
      title: expect.any(String),
      level: expect.any(Number),
      xp: expect.any(Number),
      xpToNext: expect.any(Number),
      netWorth: expect.any(Number),
      totalAssets: expect.any(Number),
      stats: expect.objectContaining({
        str: expect.any(Number),
        vit: expect.any(Number),
        int: expect.any(Number),
        agi: expect.any(Number),
        per: expect.any(Number),
        luk: expect.any(Number),
        unspentPoints: expect.any(Number),
      }),
      systemLog: expect.any(Array),
    });
  });

  it("displays the player's real name, not the 'Hunter' fallback", async () => {
    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(200);
    // The mock Clerk client returns firstName="Test" lastName="Player"
    expect(res.body.displayName).toBe("Test Player");
    expect(res.body.displayName).not.toBe("Hunter");
  });
});

describe("GET /api/dashboard/summary", () => {
  it("returns 200 with level, rank, xp, and quest stats", async () => {
    const res = await request(app).get("/api/dashboard/summary");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      level: expect.any(Number),
      rank: expect.any(String),
      netWorth: expect.any(Number),
      xp: expect.any(Number),
      xpToNext: expect.any(Number),
      questCompletionRate: expect.any(Number),
      activeQuests: expect.any(Number),
      totalSkills: expect.any(Number),
      totalBuilds: expect.any(Number),
    });
  });
});
