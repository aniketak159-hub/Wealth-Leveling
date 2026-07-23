/**
 * Quest route tests — validates that bad payloads are rejected before
 * reaching the DB, and that valid payloads return the expected shape.
 */
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import request from "supertest";
import { getAuth } from "@clerk/express";
import { db, usersTable, questsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import app from "../app";

const TEST_CLERK_ID = "test_clerk_quests_vitest";

const mockGetAuth = vi.mocked(getAuth);

beforeEach(() => {
  mockGetAuth.mockReturnValue({ userId: TEST_CLERK_ID } as any);
});

afterAll(async () => {
  // Clean up all test data created under this clerkId
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, TEST_CLERK_ID));
  if (user) {
    await db.delete(questsTable).where(eq(questsTable.userId, user.id));
    await db.delete(usersTable).where(eq(usersTable.id, user.id));
  }
});

// ── Validation: reject bad payloads ─────────────────────────────────────────

describe("POST /api/quests — validation", () => {
  it("returns 400 when title is missing", async () => {
    const res = await request(app)
      .post("/api/quests")
      .send({ xpReward: 100, frequency: "DAILY" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when title is empty string", async () => {
    const res = await request(app)
      .post("/api/quests")
      .send({ title: "", xpReward: 100, frequency: "DAILY" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when xpReward is missing", async () => {
    const res = await request(app)
      .post("/api/quests")
      .send({ title: "Save 1000", frequency: "MONTHLY" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when frequency is not a valid enum value", async () => {
    const res = await request(app)
      .post("/api/quests")
      .send({ title: "Save 1000", xpReward: 50, frequency: "YEARLY" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when xpReward is a string instead of a number", async () => {
    const res = await request(app)
      .post("/api/quests")
      .send({ title: "Save 1000", xpReward: "lots", frequency: "DAILY" });
    expect(res.status).toBe(400);
  });
});

// ── Happy path: valid payload creates a quest ────────────────────────────────

describe("POST /api/quests — success", () => {
  it("returns 201 with the created quest shape", async () => {
    const res = await request(app).post("/api/quests").send({
      title: "Emergency fund",
      xpReward: 200,
      frequency: "ONGOING",
      targetAmount: 5000,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(Number),
      title: "Emergency fund",
      xpReward: 200,
      frequency: "ONGOING",
      targetAmount: 5000,
      currentAmount: 0,
      completed: false,
    });
  });
});

// ── Progress logging ─────────────────────────────────────────────────────────

describe("POST /api/quests/:id/progress — validation", () => {
  let questId: number;

  beforeAll(async () => {
    // Create a quest to log progress against
    const res = await request(app).post("/api/quests").send({
      title: "Progress test quest",
      xpReward: 10,
      frequency: "DAILY",
      targetAmount: 100,
    });
    questId = res.body.id;
  });

  it("returns 400 when amount is missing", async () => {
    const res = await request(app)
      .post(`/api/quests/${questId}/progress`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 400 when amount is a string", async () => {
    const res = await request(app)
      .post(`/api/quests/${questId}/progress`)
      .send({ amount: "fifty" });
    expect(res.status).toBe(400);
  });

  it("returns 200 and updates currentAmount on valid progress", async () => {
    const res = await request(app)
      .post(`/api/quests/${questId}/progress`)
      .send({ amount: 25 });
    expect(res.status).toBe(200);
    expect(res.body.currentAmount).toBe(25);
  });

  it("returns 404 for a quest that does not belong to this user", async () => {
    const res = await request(app)
      .post("/api/quests/999999/progress")
      .send({ amount: 10 });
    expect(res.status).toBe(404);
  });
});
