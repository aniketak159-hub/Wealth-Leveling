# ⚔️ Wealth Leveling

A gamified personal finance web app inspired by *Solo Leveling*. Track your net worth like a power level — complete savings quests, allocate stat points, defeat debt dungeons, and rise through the Hunter Ranks from **E-Tier Novice** to **S-Rank Sovereign**.

Wealth Leveling turns money management into a status window: your real financial habits — savings rate, budget discipline, portfolio diversification, emergency fund coverage — drive XP, and XP drives Level. The numbers on your character sheet are computed from your actual income, expenses, and assets.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Status Window** | Level, Rank (E → S), Title, and an EXP bar that fills from real financial activity |
| **Hunter Stats** | STR · VIT · INT · AGI · PER · LUK — allocate stat points earned on level-up |
| **System Evaluation** | Monthly scoring pass that converts net worth growth, savings rate, budget adherence, and emergency-fund coverage into XP |
| **Quest Log** | Savings and financial goals as quests tagged **Self** (you added it) or **System** (assigned), with cadences from daily to ongoing |
| **Skill Trees** | Three trees (Investment · Savings · Knowledge) with five tiers each; unlock higher tiers by mastering lower ones |
| **Skill Check-ins** | Log recurring money habits to build streaks; streaks level up skills and earn XP |
| **Dungeons / Builds** | Model businesses as Guild entries ranked E → S; profit/loss feeds XP back to your Hunter |
| **Inventory** | Assets (cash, stocks, funds, real estate, crypto) as loot items with category-based diversification scoring |
| **Budget** | Fully custom categories, income/expense logging, and live spend-vs-limit tracking |
| **Badges & Milestones** | Unlockable rewards for financial milestones (net worth thresholds, skill counts, quest completions, etc.) |
| **PIN Lock** | A secondary PIN layer on top of Clerk auth for private device security |
| **Admin Panel** | Manage milestones and badges across all users |

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
- Level up every **5 streak points**

### Builds (Guild Hall)

- Each Build represents a business or income project, ranked **E → S**
- `profit = revenue − expenses`; profit feeds the character sheet's net worth

### Asset Categories (Inventory)

`CASH` · `STOCKS` · `MUTUAL_FUNDS` · `REAL_ESTATE` · `CRYPTO` · `OTHER`

Diversification score: `(categories used / 6) × 100`

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS v4, shadcn/ui, Radix UI |
| **Routing** | Wouter |
| **Server state** | TanStack Query (React Query v5) |
| **Backend** | Express.js, Pino structured logging |
| **Database** | PostgreSQL 16 via Drizzle ORM |
| **Auth** | Clerk (Replit-managed tenant) |
| **API contract** | OpenAPI 3.1 → Orval codegen (Zod + React Query client) |
| **Build tool** | esbuild (API server), Vite (frontend) |
| **Monorepo** | pnpm workspaces |

---

## 📁 Project Structure

```
Wealth-Leveling/
├── artifacts/
│   ├── wealth-levels/          # React + Vite frontend (preview path: /)
│   │   └── src/
│   │       ├── components/
│   │       │   └── dashboard/  # OverviewTab, StatsTab, WealthTab,
│   │       │                   # QuestsTab, BudgetTab, SkillsTab
│   │       ├── pages/          # Home, Dashboard, Admin, Profile, 404
│   │       ├── hooks/          # useSkillTree, use-mobile, etc.
│   │       └── lib/            # queryClient, apiFetch utility
│   │
│   ├── api-server/             # Express backend (preview path: /api)
│   │   └── src/
│   │       ├── routes/         # budget, wealth, skills, quests,
│   │       │                   # builds, users, dashboard, admin,
│   │       │                   # skill-tree
│   │       ├── middlewares/    # requireAuth, requireAdmin,
│   │       │                   # clerkProxyMiddleware
│   │       └── lib/            # pino logger
│   │
│   └── mockup-sandbox/         # Isolated component preview server
│
├── lib/
│   ├── db/                     # Drizzle ORM — schema + migrations
│   │   └── src/schema/         # users, dashboards, quests, skills,
│   │                           # skill_tree_unlocks, builds, budgets,
│   │                           # budget_items, wealth, wealth_assets,
│   │                           # badges, milestones
│   ├── api-spec/               # openapi.yaml + Orval config
│   ├── api-zod/                # Generated Zod validation schemas
│   └── api-client-react/       # Generated TanStack Query hooks
│
└── scripts/
    └── post-merge.sh           # Runs after task-agent merges (pnpm install + db push)
```

---

## 🔗 Contract-First API Design

The API is schema-first:

```
lib/api-spec/openapi.yaml
        │
        ├──▶ lib/api-zod/          (Zod schemas — request validation in the server)
        └──▶ lib/api-client-react/ (TanStack Query hooks — data fetching in the frontend)
```

After changing `openapi.yaml`, regenerate both libraries:

```bash
pnpm --filter @workspace/api-zod run generate
pnpm --filter @workspace/api-client-react run generate
```

The generated client is imported in the frontend — never call the API with raw `fetch` unless the endpoint is missing from the spec (e.g. `skill-tree`).

---

## 🗄 Database Schema

All tables use `serial` primary keys and are linked to `users.id` via a `userId` integer column.

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Clerk identity + local profile | `clerkId`, `displayName`, `isAdmin`, `pinHash` |
| `dashboards` | Character sheet (1-to-1 with user) | `level`, `rank`, `xp`, `xpToNext`, `netWorth`, `stat*`, `unspentPoints` |
| `quests` | User goals and savings challenges | `category` (SYSTEM/SELF), `frequency`, `targetAmount`, `currentAmount`, `completed` |
| `skills` | Recurring financial habits | `category` (INVESTMENT/SAVINGS/KNOWLEDGE), `level`, `streakCount`, `lastCheckin` |
| `skill_tree_unlocks` | Which skill-tree nodes a user has unlocked | `treeSkillId` (e.g. `inv-t1-01`) |
| `builds` | Businesses/projects (Guild Hall) | `rank` (S–E), `revenue`, `expenses` |
| `budgets` | Monthly budget header | `monthlyIncome` |
| `budget_items` | Individual budget line items | `label`, `planned`, `actual`, `sortOrder` |
| `wealth` | Wealth summary header | `netWorth` |
| `wealth_assets` | Individual assets (Inventory) | `label`, `amount`, `category` |
| `badges` | Achievement definitions | `rarity` (COMMON/RARE/EPIC/LEGENDARY), `triggerType`, `triggerValue` |
| `milestones` | Admin-managed milestone definitions | `category`, `threshold`, `xpReward` |

---

## 🌐 API Reference

All routes are prefixed `/api` and require Clerk authentication unless noted.

### Users
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check (public) |
| `GET` | `/api/users/me` | Current user profile |
| `PATCH` | `/api/users/me` | Update display name / avatar |
| `GET` | `/api/users/me/pin-status` | Check if PIN is set |
| `POST` | `/api/users/me/pin` | Set PIN (first time) |
| `PUT` | `/api/users/me/pin` | Change existing PIN |

### Dashboard / Character Sheet
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Full dashboard payload (character + quests + skills) |
| `GET` | `/api/dashboard/summary` | Lightweight stats summary |

### Quests
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/quests` | List user quests |
| `POST` | `/api/quests` | Create quest |
| `PATCH` | `/api/quests/:id` | Update quest |
| `DELETE` | `/api/quests/:id` | Delete quest |
| `POST` | `/api/quests/:id/progress` | Log progress toward a quest |

### Skills
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/skills` | List skills |
| `POST` | `/api/skills` | Create skill |
| `PATCH` | `/api/skills/:id` | Update skill / record check-in |
| `POST` | `/api/skill-tree/unlock` | Unlock a node in a skill tree |

### Builds (Guild Hall)
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/builds` | List builds |
| `POST` | `/api/builds` | Create build |
| `DELETE` | `/api/builds/:id` | Delete build |

### Budget
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/budget` | Budget + all line items |
| `PATCH` | `/api/budget` | Update income or line items |

### Wealth (Inventory)
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/wealth` | Wealth record + all assets |
| `PATCH` | `/api/wealth` | Update assets |

### Admin *(requires `isAdmin = true`)*
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/milestones` | List all milestones |
| `POST` | `/api/admin/milestones` | Create milestone |
| `PATCH` | `/api/admin/milestones/:id` | Update milestone |
| `DELETE` | `/api/admin/milestones/:id` | Delete milestone |

---

## 🔐 Authentication

Clerk is managed automatically by Replit — no account or dashboard access is required.

- **Two environments**: Development and Production have separate user stores. Development uses `pk_test` keys; production uses `pk_live` keys (auto-swapped on publish). This is expected and not a bug.
- **JIT provisioning**: `requireAuth` middleware auto-creates a local `users` row the first time a Clerk user hits any protected endpoint.
- **PIN lock**: A secondary 4-digit PIN can be set per user for shared-device privacy. Stored as a bcrypt hash in `users.pinHash`.
- **Clerk proxy**: The API server proxies Clerk's JS SDK requests so auth works behind Replit's domain routing.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20
- pnpm 10

### Install

```bash
pnpm install
```

### Environment Variables

On Replit these are auto-managed. Elsewhere, set them manually:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` | Individual PG connection parts |
| `CLERK_SECRET_KEY` | Clerk server-side secret key |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (server) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (Vite frontend) |
| `SESSION_SECRET` | Express session secret |

### Database

Push the Drizzle schema to your database:

```bash
cd lib/db && pnpm run push
```

### Run

Three workflows run in parallel:

| Workflow | Command | Port |
|---|---|---|
| Frontend | `pnpm --filter @workspace/wealth-levels run dev` | `5000` |
| API Server | `pnpm --filter @workspace/api-server run dev` | `8080` |
| Mockup Sandbox | `pnpm --filter @workspace/mockup-sandbox run dev` | auto |

On Replit, use the **Run** button — all three start automatically.

---

## 🗺 Roadmap

- Live portfolio sync (Angel One SmartAPI) instead of manual asset entry
- Recurring transactions (rent, SIPs, subscriptions)
- Party / guild leaderboards for shared accountability
- Monthly auto-generated "Hunter Report" summaries
- Mobile companion app

---

## 📄 License

MIT
