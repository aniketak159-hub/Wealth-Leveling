# ⚔️ Wealth Leveling

A gamified personal finance web app inspired by *Solo Leveling*. Track your net worth like a power level — complete savings quests, allocate stat points, defeat debt dungeons, and rise through the Hunter Ranks from **E-Tier Novice** to **S-Rank Titan**.

Wealth Leveling turns money management into a status window: your real financial habits — savings rate, budget discipline, portfolio diversification, emergency fund coverage — drive XP, and XP drives Level. It's not cosmetic gamification bolted onto a spreadsheet; the numbers on your "character sheet" are computed from your actual income, expenses, and assets.

---

## ✨ Features

- **Status Window** — Level, Rank (E → S), Title, and an EXP bar that fills from real financial activity
- **Hunter Stats** — STR (Investment Growth), VIT (Net Worth Stability), INT (Diversification), AGI (Savings Rate), PER (Budget Discipline), LUK (Emergency Fund), with allocatable stat points on level-up
- **System Evaluation** — a monthly scoring pass that converts net worth growth, savings rate, budget adherence, and emergency-fund coverage into XP
- **Quest Log** — savings and financial goals as quests, tagged **Self** (you added it) or **System** (assigned), with cadences from daily to yearly
- **Skills** — recurring money habits grouped into Investment, Savings, and Knowledge, leveling up on streaks
- **Dungeons** — model debt payoff as boss fights: log a payment, watch the HP bar drop, clear the dungeon for a big XP payout
- **Guild Hall** — your businesses as guilds, with performance reports feeding XP back to your Hunter
- **Inventory** — assets (cash, investments, business equity) as loot, with rarity tiers
- **Achievements** — unlockable titles for milestones like crossing ₹10L net worth or staying under budget everywhere
- **Budget** — fully custom categories, income/expense logging, and live spend-vs-limit tracking
- **Net Worth Trend & Spend Breakdown** — charts built from your evaluation history and category spend

---

## 🛠 Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind v4 + shadcn/ui (`artifacts/wealth-levels`) |
| Backend | Express.js (`artifacts/api-server`) |
| Database | PostgreSQL via Drizzle ORM (`lib/db`) |
| Auth | Clerk (`@clerk/react` / `@clerk/express`) |
| Monorepo | pnpm workspaces |

---

## 🚀 Getting Started

This project runs as a pnpm monorepo with three workflows:

| Workflow | Command | Preview |
|---|---|---|
| `artifacts/wealth-levels: web` | `pnpm --filter @workspace/wealth-levels run dev` | `/` |
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` | `/api` |
| `artifacts/mockup-sandbox: Component Preview Server` | `pnpm --filter @workspace/mockup-sandbox run dev` | `/__mockup` |

### Install

```bash
pnpm install
```

### Environment variables

The following are required (auto-managed if you're running on Replit — set manually elsewhere):

```
DATABASE_URL
PGHOST
PGPORT
PGUSER
PGPASSWORD
PGDATABASE
CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY
```

### Database

Schema lives in `lib/db/src/schema/`. To push schema changes to the dev database:

```bash
cd lib/db && pnpm run push
```

**Tables:** `users`, `dashboards`, `quests`, `skills`, `builds`, `budgets`, `wealth`

---

## 📁 Project Structure

```
Wealth-Leveling/
├── artifacts/
│   ├── wealth-levels/     # React + Vite frontend
│   ├── api-server/        # Express.js backend
│   └── mockup-sandbox/    # Component preview server
├── lib/
│   └── db/                # Drizzle ORM schema + migrations
├── scripts/
├── screenshots/
└── replit.md
```

---

## 🗺 Roadmap Ideas

- Live portfolio sync (e.g. Angel One SmartAPI) instead of manual asset entry
- Recurring transactions (rent, SIPs, subscriptions)
- Party / guild leaderboards for shared accountability
- Monthly auto-generated "Hunter Report" summaries

---

## 📄 License

_Add a license of your choice (MIT is a common default for personal/portfolio projects)._
