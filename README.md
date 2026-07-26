# ⚔️ Wealth Leveling

A gamified personal finance web app inspired by *Solo Leveling*. Track your net worth like a power level — complete savings quests, allocate stat points, defeat debt dungeons, and rise through the Hunter Ranks from **E-Tier Novice** to **S-Rank Sovereign**.

Wealth Leveling turns money management into a status window: your real financial habits — savings rate, budget discipline, portfolio diversification, emergency fund coverage — drive XP, and XP drives Level. The numbers on your character sheet are computed from your actual income, expenses, and assets.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Status Window** | Level, Rank (E → S), Title, and an EXP bar driven by real financial activity |
| **Hunter Stats** | STR · VIT · INT · AGI · PER · LUK — allocate stat points earned on level-up |
| **System Evaluation** | Monthly scoring pass that converts net worth growth, savings rate, budget adherence, and emergency-fund coverage into XP |
| **Quest Log** | Savings and financial goals as quests tagged **Self** (user-created) or **System** (assigned), with cadences from daily to ongoing |
| **Skill Trees** | Three trees (Investment · Savings · Knowledge) with five tiers each; unlock higher tiers by mastering lower ones |
| **Skill Check-ins** | Log recurring money habits to build streaks; streaks level up skills and earn XP |
| **Daily Streak** | Global activity streak tracked separately from skill check-ins, with its own XP reward |
| **Guild Hall / Builds** | Model businesses or income projects as Guild entries ranked E → S; profit/loss feeds back to net worth and XP |
| **Inventory** | Assets (cash, stocks, funds, real estate, crypto) as loot items with category-based diversification scoring |
| **Budget** | Fully custom categories, income/expense logging, live spend-vs-limit tracking, and transaction history |
| **Budget Analytics** | Spending breakdown by category, month-over-month trends, and wealth-sync |
| **Bank Statement Import** | Upload bank statements (CSV / PDF); the parser auto-detects 7 Indian banks and maps transactions to budget categories |
| **Badges & Milestones** | Unlockable rewards for financial milestones (net worth thresholds, skill counts, quest completions, etc.) |
| **PIN Lock + TOTP 2FA** | Secondary PIN layer on top of Clerk auth for private device security, with optional authenticator-app TOTP |
| **Level-Up Cinematic** | Full-screen Solo Leveling–style animation that fires when you cross a level threshold |
| **Admin Panel** | Manage users, push system quests, configure badges and milestones across all accounts, view leaderboard and platform stats |

---

## 🎮 Game Mechanics

### Level & XP

```
Level = floor(sqrt(totalXP / 100)) + 1   (minimum 1)
XP to next level = Level² × 100
```

### Rank Tiers

| Rank | Level Range | Title |
|---|---|---|
| **E** | 1 – 4 | Novice Wealth Hunter |
| **D** | 5 – 9 | Apprentice Wealth Hunter |
| **C** | 10 – 19 | Seasoned Wealth Hunter |
| **B** | 20 – 29 | Wealth Architect |
| **A** | 30 – 49 | Elite Financial Commander |
| **S** | 50+ | Sovereign Wealth Master |

### Monthly Evaluation — XP Gains

| Metric | Formula | Cap |
|---|---|---|
| Savings Rate | `savingsRate × 2` | 200 XP |
| Budget Adherence | `budgetAdherence × 1.5` | 150 XP |
| Emergency Fund | `emergencyFundMonths × 16` | 100 XP |
| Investment Growth | `investmentGrowth × 5` | 100 XP |
| Diversification | `diversificationScore × 0.5` | 50 XP |
| Minimum floor | — | 10 XP |

Stat points earned per evaluation: `floor(xpGained / 100)`

### Hunter Stats

| Stat | Meaning |
|---|---|
| **STR** | Investment Growth |
| **VIT** | Net Worth Stability |
| **INT** | Diversification |
| **AGI** | Savings Rate |
| **PER** | Budget Discipline |
| **LUK** | Emergency Fund Coverage |

### Skill Trees

- Three trees: **Investment**, **Savings**, **Knowledge**
- Five tiers per tree; unlocking Tier N+1 requires 6 skills completed in Tier N
- XP per tier: 15 · 25 · 40 · 60 · 90; capstone bonus: **200 XP**

### Skill Check-ins

- Streak increments after a gap of **> 20 hours**
- XP per check-in: `min(50, 10 + level × 5)`
- Skill levels up every **5 streak points**

### Daily Streak

- Separate global streak tracked per user
- Maintained by daily check-in calls; resets if a day is skipped
- XP reward on each check-in

### Builds (Guild Hall)

- Each Build represents a business or income project, ranked **E → S**
- `profit = revenue − expenses`; profit feeds the character sheet's net worth

### Asset Categories (Inventory)

`CASH` · `STOCKS` · `MUTUAL_FUNDS` · `REAL_ESTATE` · `CRYPTO` · `OTHER`

Diversification score: `(unique categories used / 6) × 100`

---

## 🛠 Tech Stack

### Frontend — `artifacts/wealth-levels`

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| UI components | Radix UI + shadcn/ui |
| Routing | React Router v6 |
| Server state | TanStack Query (React Query) — hooks auto-generated from OpenAPI |
| Auth | Clerk (hosted sign-in/sign-up, themed to app branding) |
| Animations | Framer Motion |

### Backend — `artifacts/api-server`

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| Auth middleware | `@clerk/express` — verifies Clerk session tokens |
| Build | esbuild (single-file bundle) |
| Testing | Vitest |

### Shared Libraries — `lib/`

| Package | Purpose |
|---|---|
| `@workspace/db` | Drizzle ORM + PostgreSQL schema (13 tables), `drizzle-kit` migrations |
| `@workspace/api-spec` | Single source-of-truth OpenAPI 3.1 spec (`openapi.yaml`) + Orval codegen config |
| `@workspace/api-client-react` | Auto-generated TanStack Query hooks and `customFetch` client (produced by Orval from the spec) |
| `@workspace/api-zod` | Auto-generated Zod validation schemas for every request/response (produced by Orval from the spec) |

### Infrastructure

- **Monorepo**: pnpm workspaces
- **Database**: PostgreSQL (Replit-managed or external)
- **Auth**: Clerk (white-label, separate dev and production tenants)
- **Codegen**: Orval regenerates React Query hooks and Zod schemas from `openapi.yaml` on every spec change

---

## 🗄 Database Schema

All tables are managed via Drizzle ORM. Push the schema with `pnpm run push` inside `lib/db`.

| Table | Key Columns |
|---|---|
| `users` | `clerkId`, `displayName`, `pinHash`, `totpSecret`, `totpEnabled`, `isAdmin` |
| `dashboards` | `level`, `xp`, `rank`, `str/vit/int/agi/per/luk`, `statPoints`, `streakDays` |
| `wealth` | `netWorth`, linked to `wealth_assets` |
| `wealth_assets` | `label`, `amount`, `category` (STOCKS, MUTUAL_FUNDS, REAL_ESTATE, CASH, CRYPTO, OTHER) |
| `budgets` | `monthlyIncome`, linked to `budget_items` and `transactions` |
| `budget_items` | `label`, `planned`, `actual` |
| `transactions` | `date`, `amount`, `description`, `category`, `source` |
| `quests` | `title`, `type` (SELF/SYSTEM), `cadence`, `reward`, `progress`, `completed` |
| `skills` | `name`, `category` (INVESTMENT/SAVINGS/KNOWLEDGE), `tier`, `streakPoints`, `level` |
| `skill_tree_unlocks` | `tier`, `category`, `unlockedAt` |
| `badges` | `name`, `description`, `icon`, `condition` |
| `milestones` | `label`, `threshold`, `badgeId` |
| `builds` | `name`, `description`, `rank`, `revenue`, `expenses` |

---

## 🔐 Security

### Clerk Authentication

All API routes (except `/api/healthz` and `/api/auth/pin-login`) are protected by Clerk session token verification via the `requireAuth` middleware. The middleware also loads the user's database row and attaches it to `req.dbUser`.

### PIN Lock

Users can optionally set a 4–6 digit numeric PIN as a secondary lock on the app:

- **Set PIN**: `POST /api/users/me/pin`
- **Change PIN**: `PUT /api/users/me/pin` (requires current PIN)
- **Remove PIN**: `DELETE /api/users/me/pin` (requires PIN confirmation)
- **Status**: `GET /api/users/me/pin-status`

### TOTP 2FA (Authenticator App)

Users with a PIN set can additionally enable time-based one-time passwords (Google Authenticator, Authy, etc.):

- **Setup**: `POST /api/auth/totp/setup` — generates a QR code and manual entry secret
- **Enable**: `POST /api/auth/totp/enable` — confirms with a valid 6-digit code
- **Disable**: `DELETE /api/auth/totp/disable` — requires a valid code
- **Status**: `GET /api/auth/totp/status`

### PIN Login Flow

`POST /api/auth/pin-login` accepts `{ email, pin, totpCode? }`. If TOTP is enabled and no `totpCode` is provided, the endpoint returns `{ requiresTotp: true }` — the UI then prompts for the authenticator code and retries. On success it returns a short-lived Clerk sign-in token that the frontend exchanges for a full session.

---

## 📥 Bank Statement Import

The import pipeline handles 7 Indian banks automatically:

| Bank | Format |
|---|---|
| HDFC | CSV |
| SBI | CSV |
| ICICI | CSV |
| Axis | CSV |
| Kotak | CSV |
| Yes Bank | CSV |
| IDFC First | CSV |

**Flow:**

1. Upload via `POST /api/import/csv` — returns parsed rows with auto-categorised amounts
2. Review in the Import Wizard UI
3. Confirm via `POST /api/import/apply` — writes transactions and syncs the budget

---

## 🏦 Bank Sync (Coming Soon)

The Account Aggregator (AA) integration skeleton is present under `/api/aa/*` using the **Setu AA framework**. It currently returns `503 AA_NOT_CONFIGURED` until `SETU_CLIENT_ID` and `SETU_CLIENT_SECRET` are set. When configured it will support consent-based live bank data sync.

---

## 🔧 Codegen Pipeline

Any change to `lib/api-spec/openapi.yaml` must be followed by:

```bash
pnpm run --filter @workspace/api-spec codegen
```

This runs Orval and regenerates:
- `lib/api-client-react/src/generated/` — TanStack Query hooks for every endpoint
- `lib/api-zod/src/generated/` — Zod request/response schemas

All frontend components should import from `@workspace/api-client-react` rather than calling `fetch()` directly.

---

## 🚀 Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database

### Install

```bash
pnpm install
```

### Cold checkout build order

The API and frontend consume declaration files emitted by the shared
libraries. On a fresh checkout, build those libraries before running a
dependent package check:

```bash
pnpm run build:libs
```

The post-merge setup runs this automatically. The API and frontend
`typecheck` scripts also build the shared libraries first, so direct
leaf-package checks work without relying on cached `dist/` files.

### Environment Variables

On Replit these are auto-managed via Secrets. Elsewhere, set them manually:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` | Individual PG connection parts (alternative to `DATABASE_URL`) |
| `CLERK_SECRET_KEY` | Clerk server-side secret key |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (used by server) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (injected into the Vite frontend) |
| `SESSION_SECRET` | Express session secret |
| `SETU_CLIENT_ID` | *(Optional)* Setu AA client ID for live bank sync |
| `SETU_CLIENT_SECRET` | *(Optional)* Setu AA client secret for live bank sync |

> **Note on Clerk environments:** The development Clerk tenant and the production Clerk tenant are separate user stores. Users registered in development will not exist in production, and vice versa. PostgreSQL rows are keyed by Clerk user IDs — switching environments effectively starts a fresh user database.

### Database

Push the Drizzle schema to your database:

```bash
cd lib/db && pnpm run push
```

### Codegen (after spec changes)

```bash
pnpm run --filter @workspace/api-spec codegen
```

### Run

Three workflows run in parallel:

| Workflow | Command | Default Port |
|---|---|---|
| Frontend | `pnpm --filter @workspace/wealth-levels run dev` | `23656` |
| API Server | `pnpm --filter @workspace/api-server run dev` | `8080` |
| Mockup Sandbox | `pnpm --filter @workspace/mockup-sandbox run dev` | auto |

On Replit, use the **Run** button — all three start automatically via managed workflows.

### Type Check

```bash
pnpm run typecheck        # checks all packages
pnpm run typecheck:libs   # checks shared libraries only
```

---

## 🗺 Roadmap

- Live portfolio sync (Angel One SmartAPI) instead of manual asset entry
- Full Setu Account Aggregator integration for automatic bank sync
- Recurring transactions (rent, SIPs, subscriptions) with smart suggestions
- Party / guild leaderboards for shared accountability
- Monthly auto-generated "Hunter Report" PDF summaries
- Mobile companion app (Expo)

---

## 📄 License

MIT
