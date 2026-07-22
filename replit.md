# Wealth Leveling

A gamified personal finance web app. Track your net worth like a power level — complete savings quests, allocate stats, and rise through the ranks from E-Tier Novice to S-Rank Titan.

## Stack

- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui (`artifacts/wealth-levels`)
- **Backend**: Express.js (`artifacts/api-server`)
- **Database**: PostgreSQL via Drizzle ORM (`lib/db`)
- **Auth**: Replit-managed Clerk (`@clerk/react` / `@clerk/express`)
- **Monorepo**: pnpm workspaces

## How to run

All three workflows are configured and start automatically:

| Workflow | Command | Preview |
|---|---|---|
| `artifacts/wealth-levels: web` | `pnpm --filter @workspace/wealth-levels run dev` | `/` |
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` | `/api` |
| `artifacts/mockup-sandbox: Component Preview Server` | `pnpm --filter @workspace/mockup-sandbox run dev` | `/__mockup` |

## Environment

The following are auto-managed by Replit — do not set manually:
- `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

## Database schema

Schema lives in `lib/db/src/schema/`. To push schema changes to the dev database:

```bash
cd lib/db && pnpm run push
```

Tables: `users`, `dashboards`, `quests`, `skills`, `builds`, `budgets`, `wealth`

## User preferences
