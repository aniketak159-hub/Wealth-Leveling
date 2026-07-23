import { vi } from "vitest";

// ── Clerk mocks ───────────────────────────────────────────────────────────────
// These are hoisted by Vitest and apply to every test file.
// Individual tests can override getAuth behaviour with vi.mocked(getAuth).

vi.mock("@clerk/express", () => ({
  clerkMiddleware:
    vi.fn(
      () =>
        (_req: unknown, _res: unknown, next: () => void) =>
          next(),
    ),
  getAuth: vi.fn(() => ({ userId: "test_clerk_id_default" })),
  createClerkClient: vi.fn(() => ({
    users: {
      getUser: vi.fn(async () => ({
        firstName: "Test",
        lastName: "Player",
        username: null,
        emailAddresses: [{ emailAddress: "testplayer@example.com" }],
      })),
      getUserList: vi.fn(async () => ({ data: [] })),
    },
    signInTokens: {
      createSignInToken: vi.fn(async () => ({ token: "mock_sign_in_token" })),
    },
  })),
}));

vi.mock("@clerk/shared/keys", () => ({
  publishableKeyFromHost: vi.fn(() => "pk_test_mock"),
}));
