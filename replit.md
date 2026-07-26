# Wealth Leveling

A gamified personal finance web app inspired by *Solo Leveling*. Track net worth like a power level — complete savings quests, allocate stat points, defeat debt dungeons, and rise through Hunter Ranks (E → S).

## Stack

- **Frontend**: React + Vite + Tailwind v4 + Wouter + TanStack Query (`artifacts/wealth-levels`)
- **API Server**: Express + Clerk Auth + Drizzle ORM (`artifacts/api-server`)
- **Database**: Replit PostgreSQL (Drizzle schema in `lib/db`)
- **Auth**: Replit-managed Clerk (keys auto-provisioned, `pk_test` in dev is expected)
- **Shared libs**: `lib/api-client-react` (generated OpenAPI client), `lib/api-zod` (Zod schemas), `lib/api-spec` (OpenAPI spec + codegen)

## Running

Three workflows run in parallel (managed by Replit):

| Workflow | Command |
|---|---|
| Frontend | `PORT=23656 BASE_PATH=/ pnpm --filter @workspace/wealth-levels run dev` |
| API Server | `PORT=8080 pnpm --filter @workspace/api-server run dev` |
| Mockup Sandbox | `pnpm --filter @workspace/mockup-sandbox run dev` |

## Database

Schema is already pushed. To re-push after schema changes:

```bash
cd lib/db && pnpm run push
```

## Codegen (after OpenAPI spec changes)

```bash
pnpm run --filter @workspace/api-spec codegen
```

## Type Check

```bash
pnpm run typecheck        # all packages
pnpm run typecheck:libs   # shared libraries only
```

## Auth Notes

- Clerk keys are stored in Replit Secrets (`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`)
- Dev and production Clerk environments are separate user stores — accounts don't cross over
- The `pk_test` key in dev is expected and normal

## User Preferences

<!-- Add user preferences here -->
