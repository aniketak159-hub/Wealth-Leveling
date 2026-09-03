import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Link, Route, Router, Switch } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import PinGate from "@/components/PinGate";

const mockUser = vi.hoisted(() => ({ id: "pin-route-test-user" }));

vi.mock("@clerk/react", () => ({
  useUser: () => ({ user: mockUser }),
}));

const PIN = "4826";

function response(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function DashboardRoute() {
  return (
    <PinGate>
      <h1>Dashboard</h1>
      <Link href="/profile">Go to profile</Link>
    </PinGate>
  );
}

function ProfileRoute() {
  return (
    <PinGate>
      <h1>Profile</h1>
      <Link href="/dashboard">Go to dashboard</Link>
    </PinGate>
  );
}

function ProtectedRouteFixture() {
  return (
    <Switch>
      <Route path="/dashboard" component={DashboardRoute} />
      <Route path="/profile" component={ProfileRoute} />
    </Switch>
  );
}

function renderProtectedRoutes() {
  const location = memoryLocation({ path: "/dashboard" });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Router hook={location.hook}>
        <ProtectedRouteFixture />
      </Router>
    </QueryClientProvider>,
  );

  return location;
}

describe("PIN protection across protected route changes", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: RequestInfo | URL, init?: RequestInit) => {
        const url = String(request);

        if (url.endsWith("/api/users/me/pin-status")) {
          return response({ hasPinSet: true });
        }

        if (url.endsWith("/api/auth/pin-verify")) {
          const body = JSON.parse(String(init?.body ?? "{}")) as {
            pin?: string;
          };
          return body.pin === PIN
            ? response({ success: true })
            : response({ error: "Incorrect PIN." }, 401);
        }

        throw new Error(`Unexpected request: ${url}`);
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("re-prompts after dashboard → profile → dashboard and handles wrong and right PINs", async () => {
    const location = renderProtectedRoutes();

    expect(
      await screen.findByText("Re-Entry Verification"),
    ).toBeInTheDocument();

    const pinInput = screen.getByLabelText("PIN");
    const user = userEvent.setup();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled(),
    );
    await user.type(pinInput, "0000");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect PIN.",
    );
    expect(screen.getByText("Re-Entry Verification")).toBeInTheDocument();

    await user.clear(pinInput);
    await user.type(pinInput, PIN);
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();

    location.navigate("/profile");
    expect(
      await screen.findByText("Re-Entry Verification"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Profile" }),
    ).not.toBeInTheDocument();

    const profilePin = screen.getByLabelText("PIN");
    await user.type(profilePin, "0000");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect PIN.",
    );

    await user.clear(profilePin);
    await user.type(profilePin, PIN);
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(
      await screen.findByRole("heading", { name: "Profile" }),
    ).toBeInTheDocument();

    location.navigate("/dashboard");
    expect(
      await screen.findByText("Re-Entry Verification"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
  });
});
