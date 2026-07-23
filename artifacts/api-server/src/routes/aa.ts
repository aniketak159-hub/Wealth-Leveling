// Account Aggregator (AA) integration scaffold — India's RBI-sanctioned
// open-banking framework. Full integration requires FIU registration with
// an AA ecosystem participant (e.g. Setu, Finvu, Perfios).
//
// This file stubs the consent and data-fetch lifecycle so the frontend can
// render the full flow. Wire up with real Setu credentials when ready.

import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const SETU_BASE_URL = process.env.SETU_BASE_URL ?? "https://fiu-uat.setu.co";
const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const AA_CONFIGURED = Boolean(SETU_CLIENT_ID && SETU_CLIENT_SECRET);

function notConfigured(res: any) {
  res.status(503).json({
    error: "AA_NOT_CONFIGURED",
    message:
      "Account Aggregator integration is not yet active. Set SETU_CLIENT_ID and SETU_CLIENT_SECRET to enable bank sync. Contact your admin or visit setu.co to register as an FIU.",
  });
}

// ─── POST /aa/consent ─────────────────────────────────────────────────────────
// Initiate a consent request. Returns a redirectUrl the frontend opens so the
// user approves data sharing in their bank's AA app (e.g. CAMS, OneMoney).

router.post("/aa/consent", requireAuth, async (req, res): Promise<void> => {
  if (!AA_CONFIGURED) { notConfigured(res); return; }

  const user = (req as any).dbUser;
  const { fiTypes = ["DEPOSIT", "MUTUAL_FUNDS", "EQUITIES"] } = req.body as {
    fiTypes?: string[];
  };

  try {
    const response = await fetch(`${SETU_BASE_URL}/v2/consents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": SETU_CLIENT_ID!,
        "x-client-secret": SETU_CLIENT_SECRET!,
      },
      body: JSON.stringify({
        consentDuration: { unit: "MONTH", value: 1 },
        dataRange: { from: new Date(Date.now() - 90 * 86400_000).toISOString(), to: new Date().toISOString() },
        purpose: { code: "14", text: "Wealth tracking and budgeting" },
        fiTypes,
        vua: `${user.id}@setu`,        // Virtual User Address — replace with real UPI/AA id
        redirectUrl: process.env.AA_REDIRECT_URL ?? `${req.headers.origin}/dashboard`,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      res.status(response.status).json({ error: "Setu error", detail: body });
      return;
    }

    const data = (await response.json()) as { id: string; url: string };
    res.json({ consentHandle: data.id, redirectUrl: data.url });
  } catch (err) {
    res.status(502).json({ error: "Failed to reach AA network", detail: String(err) });
  }
});

// ─── GET /aa/consent/:handle ──────────────────────────────────────────────────
// Poll consent status after the user returns from their bank's AA app.

router.get("/aa/consent/:handle", requireAuth, async (req, res): Promise<void> => {
  if (!AA_CONFIGURED) { notConfigured(res); return; }

  try {
    const response = await fetch(
      `${SETU_BASE_URL}/v2/consents/${req.params.handle}`,
      {
        headers: {
          "x-client-id": SETU_CLIENT_ID!,
          "x-client-secret": SETU_CLIENT_SECRET!,
        },
      },
    );
    const data = await response.json();
    res.json({ status: (data as any).status ?? "UNKNOWN", raw: data });
  } catch (err) {
    res.status(502).json({ error: "Failed to reach AA network", detail: String(err) });
  }
});

// ─── POST /aa/fetch ───────────────────────────────────────────────────────────
// Fetch financial data for an approved consent. Returns a normalised summary
// that the frontend can display before the user chooses to apply it.

router.post("/aa/fetch", requireAuth, async (req, res): Promise<void> => {
  if (!AA_CONFIGURED) { notConfigured(res); return; }

  const { consentHandle } = req.body as { consentHandle: string };
  if (!consentHandle) {
    res.status(400).json({ error: "consentHandle required" });
    return;
  }

  try {
    // 1. Create a data session
    const sessionRes = await fetch(`${SETU_BASE_URL}/v2/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": SETU_CLIENT_ID!,
        "x-client-secret": SETU_CLIENT_SECRET!,
      },
      body: JSON.stringify({ consentId: consentHandle }),
    });

    if (!sessionRes.ok) {
      res.status(sessionRes.status).json({ error: "Could not create AA session" });
      return;
    }

    const session = (await sessionRes.json()) as { id: string };

    // 2. Fetch the data (Setu processes this async; poll in production)
    const dataRes = await fetch(
      `${SETU_BASE_URL}/v2/sessions/${session.id}`,
      {
        headers: {
          "x-client-id": SETU_CLIENT_ID!,
          "x-client-secret": SETU_CLIENT_SECRET!,
        },
      },
    );

    const raw = await dataRes.json();
    // Return raw AA data — frontend will normalise and present preview
    res.json({ sessionId: session.id, data: raw });
  } catch (err) {
    res.status(502).json({ error: "Failed to reach AA network", detail: String(err) });
  }
});

// ─── GET /aa/status ───────────────────────────────────────────────────────────
// Quick check: is AA configured on this server?

router.get("/aa/status", requireAuth, (req, res) => {
  res.json({ configured: AA_CONFIGURED });
});

export default router;
