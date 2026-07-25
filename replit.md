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

## Test user

Email: `jagruthi1221@gmail.com`

A pre-seeded test account is committed to the repo. Its full data (dashboard, quests, skills, builds, budget, wealth) lives in `scripts/seed-test-user/data.json` and is automatically restored into the database on every setup via `scripts/post-merge.sh`.

### If the Clerk user is deleted and re-created

1. Sign in with `jagruthi1221@gmail.com` — Clerk will assign a new ID.
2. Find the new Clerk ID: open the browser console and run `fetch('/api/me').then(r=>r.json()).then(d=>console.log(d.clerkId))`, or check the Replit Auth pane.
3. Run: `node scripts/seed-test-user/restore.mjs <new-clerk-id>`
4. Update the snapshot so future restores use the new ID: `node scripts/seed-test-user/export.mjs`
5. Commit `scripts/seed-test-user/data.json`.

### Keeping the snapshot current

Whenever you add quests, skills, or other progress you want preserved, run:

```bash
node scripts/seed-test-user/export.mjs
```

Then commit `scripts/seed-test-user/data.json`.

## User preferences
