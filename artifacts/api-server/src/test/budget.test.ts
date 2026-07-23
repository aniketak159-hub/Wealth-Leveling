/**
 * Budget route tests — validates that bad payloads are rejected before
 * reaching the DB, and that valid payloads return the expected shape.
 */
import {
  describe,
  it,
  expect,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import request from "supertest";
import { getAuth } from "@clerk/express";
import { db, usersTable, budgetsTable, budgetItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import app from "../app";

const TEST_CLERK_ID = "test_clerk_budget_vitest";

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
    const [budget] = await db
      .select()
      .from(budgetsTable)
      .where(eq(budgetsTable.userId, user.id));
    if (budget) {
      await db
        .delete(budgetItemsTable)
        .where(eq(budgetItemsTable.budgetId, budget.id));
      await db.delete(budgetsTable).where(eq(budgetsTable.id, budget.id));
    }
    await db.delete(usersTable).where(eq(usersTable.id, user.id));
  }
});

// ── Validation: reject bad payloads ─────────────────────────────────────────

describe("PATCH /api/budget — validation", () => {
  it("returns 400 when monthlyIncome is a string", async () => {
    const res = await request(app)
      .patch("/api/budget")
      .send({ monthlyIncome: "five thousand" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when a budget item is missing its label", async () => {
    const res = await request(app)
      .patch("/api/budget")
      .send({ items: [{ planned: 500, actual: 450 }] });
    expect(res.status).toBe(400);
  });

  it("returns 400 when a budget item has a non-numeric planned value", async () => {
    const res = await request(app)
      .patch("/api/budget")
      .send({ items: [{ label: "Rent", planned: "five hundred", actual: 0 }] });
    expect(res.status).toBe(400);
  });

  it("returns 400 when a budget item is missing actual", async () => {
    const res = await request(app)
      .patch("/api/budget")
      .send({ items: [{ label: "Rent", planned: 500 }] });
    expect(res.status).toBe(400);
  });
});

// ── Happy path: valid payloads ───────────────────────────────────────────────

describe("PATCH /api/budget — success", () => {
  it("returns 200 with updated monthlyIncome", async () => {
    const res = await request(app)
      .patch("/api/budget")
      .send({ monthlyIncome: 4500 });
    expect(res.status).toBe(200);
    expect(res.body.monthlyIncome).toBe(4500);
  });

  it("returns 200 with budget items and correct shape", async () => {
    const res = await request(app)
      .patch("/api/budget")
      .send({
        monthlyIncome: 5000,
        items: [
          { label: "Rent", planned: 1200, actual: 1200 },
          { label: "Food", planned: 600, actual: 550 },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      monthlyIncome: 5000,
      items: expect.arrayContaining([
        expect.objectContaining({ label: "Rent", planned: 1200, actual: 1200 }),
        expect.objectContaining({ label: "Food", planned: 600, actual: 550 }),
      ]),
    });
  });

  it("returns 200 with empty items array (clears all budget lines)", async () => {
    const res = await request(app).patch("/api/budget").send({ items: [] });
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });
});

// ── Read ─────────────────────────────────────────────────────────────────────

describe("GET /api/budget", () => {
  it("returns 200 with budget shape", async () => {
    const res = await request(app).get("/api/budget");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: expect.any(Number),
      userId: expect.any(Number),
      monthlyIncome: expect.any(Number),
      items: expect.any(Array),
    });
  });
});
