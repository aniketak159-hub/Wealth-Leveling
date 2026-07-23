/**
 * Auth guard tests — every protected endpoint must return 401 when the
 * Clerk session is absent, preventing unauthenticated data access.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { getAuth } from "@clerk/express";
import app from "../app";

const mockGetAuth = vi.mocked(getAuth);

// Simulate an unauthenticated request for every test in this suite
beforeEach(() => {
  mockGetAuth.mockReturnValue({ userId: null } as any);
});

const PROTECTED: Array<{ method: "get" | "patch" | "post"; path: string }> = [
  { method: "get",   path: "/api/users/me" },
  { method: "get",   path: "/api/dashboard" },
  { method: "get",   path: "/api/dashboard/summary" },
  { method: "get",   path: "/api/quests" },
  { method: "post",  path: "/api/quests" },
  { method: "get",   path: "/api/budget" },
  { method: "patch", path: "/api/budget" },
  { method: "get",   path: "/api/wealth" },
  { method: "get",   path: "/api/skills" },
  { method: "get",   path: "/api/builds" },
];

describe("Auth guards", () => {
  for (const { method, path } of PROTECTED) {
    it(`${method.toUpperCase()} ${path} → 401 without a session`, async () => {
      const res = await (request(app) as any)[method](path).send({});
      expect(res.status).toBe(401);
    });
  }
});
