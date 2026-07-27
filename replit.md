# Wealth Levels

A gamified personal finance and self-improvement dashboard inspired by *Solo Leveling*. Track your net worth like a power level — complete savings quests, allocate RPG stat points, raid income-source dungeons, and rise through Hunter Ranks (E → S).

---

## Concept

Every financial metric maps to an RPG mechanic:

| Real World | In-Game |
|---|---|
| Net worth growth | XP & levelling up |
| Savings habits | Quest completions |
| Income sources / side hustles | Dungeon raids (Builds) |
| Skills & knowledge | Skill tree unlocks |
| Budget discipline | Stat points (STR, VIT, INT…) |

The UI uses a glowing cyan HUD aesthetic with monospace fonts, rank badges, and "SYSTEM initializing" language throughout.

---

## Monorepo Structure

```
/
├── artifacts/
│   ├── api-server/          Express API (auth, data, Clerk middleware)
│   ├── wealth-levels/       React + Vite frontend
│   └── mockup-sandbox/      UI component design playground
│
├── lib/
│   ├── db/                  Drizzle ORM schema + migrations
│   ├── api-zod/             Zod schemas for all request/response validation
│   ├── api-client-react/    Generated TanStack Query hooks (via Orval)
│   └── api-spec/            OpenAPI spec + Orval codegen config
│
└── scripts/
    └── post-merge.sh        Runs automatically after a GitHub import/merge
```

---

## Tech Stack

**Frontend** (`artifacts/wealth-levels`)
- React 19, Vite 7, Tailwind CSS v4, shadcn/ui
- Wouter (routing), TanStack Query (data fetching)
- Clerk React SDK, Framer Motion, Lucide icons

**API Server** (`artifacts/api-server`)
- Node.js, Express 5, Pino (structured logging)
- Clerk Express SDK (auth middleware)
- Drizzle ORM + node-postgres
- Zod validation via `@workspace/api-zod`
- esbuild (bundled for production)

**Database**
- Replit-managed PostgreSQL, accessed via `DATABASE_URL`
- Schema defined in `lib/db/src/schema/`, migrations via `drizzle-kit push`

**Shared Libraries**
- `lib/api-zod` — hand-maintained Zod schemas + orval-generated TypeScript types
- `lib/api-client-react` — orval-generated React Query hooks from the OpenAPI spec
- `lib/api-spec` — OpenAPI 3 spec (`openapi.yaml`) + orval config for codegen

---

## Dashboard Tabs

| Tab | Description |
|---|---|
| **OVERVIEW** | Level, XP bar, rank badge, net worth, recent system log entries |
| **STATS** | RPG attributes (STR / VIT / INT / AGI / PER / LUK) — allocate stat points earned from quests |
| **WEALTH** | Asset tracking by category (stocks, mutual funds, cash, etc.) and total net worth |
| **QUESTS** | SELF and SYSTEM quest boards — create targets, log progress, earn XP on completion |
| **BUDGET** | Monthly income, planned vs actual expenses by category, transaction log |
| **SKILLS** | Skill tree with tiered unlocks; separate habits tracker |
| **DUNGEONS** | Income source / side-hustle tracker with ACTIVE / ON HOLD / CLEARED status, revenue, expenses, net profit per build |

Each tab is wrapped in an isolated React error boundary — a crash in one tab never takes down the rest of the dashboard.

---

## Authentication

Three layers, all optional beyond Clerk:

1. **Clerk** — primary identity (Google OAuth or email/password). Managed by Replit; keys auto-provisioned.
2. **PIN login** — alternative login flow (email + 4–6 digit PIN hashed server-side). Accessible from the sign-in page.
3. **TOTP 2FA** — optional authenticator app (otplib) on top of PIN login. Enabled via the Security page.

Session expiry is handled globally: a 401 from any API call triggers an immediate sign-out and redirect to home.

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Clerk user ID, PIN hash, TOTP secret + enabled flag, admin flag |
| `dashboards` | Level, XP, rank, RPG stat points, streak data, display name, title |
| `wealth` | Snapshot net worth totals per user |
| `wealth_assets` | Individual asset entries (name, category, value) |
| `quests` | Quest definitions — title, category, frequency, XP reward, target amount, data link |
| `skills` | User skill records |
| `skill_tree_unlocks` | Which skill tree nodes each user has unlocked |
| `budgets` | Monthly income setting per user |
| `budget_items` | Planned / actual amounts per budget category |
| `transactions` | Individual income/expense transactions |
| `builds` | Dungeon raid entries — name, rank, status (ACTIVE/ON_HOLD/CLEARED), revenue, expenses |
| `badges` | Achievement badges earned |
| `milestones` | Long-term milestone definitions and completion state |

---

## Setting Up from a GitHub Import

### Automatic (handled by post-merge script)
`scripts/post-merge.sh` runs automatically after every import or task merge:
```bash
pnpm install --frozen-lockfile
pnpm run build:libs          # emit shared TS declarations
pnpm --filter db push        # push Drizzle schema to the database
```
The Replit PostgreSQL database is pre-provisioned — no manual DB setup needed.

### One manual step — Clerk auth
Clerk keys are never committed to the repo (they're provisioned per-Repl). Two options:

**Option A — Auth pane (recommended for production use)**
1. Open the **Auth** pane in the Replit workspace toolbar
2. Enable Clerk — Replit sets `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY` automatically

**Option B — Committed dev keys (already done)**
The `.env` files at `artifacts/wealth-levels/.env` and `artifacts/api-server/.env` contain the development Clerk keys from the original Repl. On import these travel with the repo and the app starts immediately — all sign-ups go into the same dev Clerk tenant. Suitable for testing; swap for provisioned keys before going to production.

---

## Development Commands

```bash
# Install all workspace dependencies
pnpm install

# Build shared library declarations (required before running the app fresh)
pnpm run build:libs

# Push DB schema changes to the database
cd lib/db && pnpm run push

# Typecheck everything
pnpm run typecheck

# Typecheck shared libs only
pnpm run typecheck:libs

# Regenerate API client hooks from OpenAPI spec (after editing lib/api-spec/openapi.yaml)
pnpm --filter @workspace/api-spec run codegen
```

### Workflows (started automatically by Replit)

| Workflow | Command |
|---|---|
| Frontend | `pnpm --filter @workspace/wealth-levels run dev` |
| API Server | `PORT=8080 pnpm --filter @workspace/api-server run dev` |
| Mockup Sandbox | `pnpm --filter @workspace/mockup-sandbox run dev` |

---

## Environment Variables

| Variable | Where set | Purpose |
|---|---|---|
| `DATABASE_URL` | Replit PostgreSQL (auto) | Postgres connection string |
| `CLERK_PUBLISHABLE_KEY` | Replit Auth pane or `.env` | Clerk backend pub key |
| `CLERK_SECRET_KEY` | Replit Auth pane or `.env` | Clerk backend secret |
| `VITE_CLERK_PUBLISHABLE_KEY` | Replit Auth pane or `.env` | Clerk frontend pub key |
| `SESSION_SECRET` | Replit Secrets | Express session signing |
| `PORT` | Injected by Replit per workflow | Server listen port |

---

## User Preferences

<!-- Add persistent user preferences here -->
