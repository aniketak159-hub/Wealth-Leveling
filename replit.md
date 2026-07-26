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

On a fresh checkout, shared library declarations are built before the
dependent API and frontend checks run. This is also performed by the
post-merge setup:

```bash
pnpm run build:libs
```

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

## Fresh database behavior

Fresh imports start with an empty vault. The post-merge setup only installs
dependencies and applies the database schema; it does not restore demo or
test-user data.

An optional development snapshot remains available if you explicitly want
fixture data:

```bash
node scripts/seed-test-user/restore.mjs <clerk-user-id>
```

Do not commit Clerk keys or other credentials. Replit-managed Clerk provisions
`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and
`VITE_CLERK_PUBLISHABLE_KEY` automatically for the Repl.

## User preferences
