# Wealth Levels

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

---

## Features

### Authentication
- **Clerk-powered sign-in / sign-up** with a custom cyberpunk HUD theme
- **Secret PIN login** — players can set a 4–6 digit PIN during onboarding or from their profile; future logins offer PIN as an alternative to password + OTP
  - PIN is bcrypt-hashed and stored server-side; never exposed to the frontend
  - API: `POST /api/users/me/pin`, `PUT /api/users/me/pin`, `DELETE /api/users/me/pin`, `POST /api/auth/pin-login`
  - Profile page has a dedicated **Secret PIN** card for set / change / remove

### Animated Boot Loader
- Cinematic tech-screen overlay on every app load
- Cycles through four financial leveling lessons (Secure Cash Flow, Turn Goals into Streaks, Allocate Stats, Compound the Advantage)
- Auto-dismisses; styled as a "Player Training Protocol" HUD

### Player Progression (XP / Level / Rank)
- **XP** earned from monthly financial evaluations (savings rate, budget adherence, emergency fund, investment growth, diversification)
- **Level** calculated via `floor(sqrt(xp / 100)) + 1`
- **Rank** ladder: E → D → C → B → A → S (unlocked at levels 5, 10, 20, 30, 50)
- **Titles** track level milestones (Novice → Apprentice → Seasoned → Wealth Architect → Elite Commander → Sovereign Master)
- **Stat points** (STR / VIT / INT / AGI / PER / LUK) allocated manually; bonus points awarded on evaluation

### Streak Shield Retention Loop
The core daily retention mechanic — because losing a 40-day streak over one missed Tuesday is the #1 silent-churn killer in habit apps.

**How streaks work:**
- A `POST /api/streak/checkin` call fires automatically when the player opens the dashboard
- **Consecutive day** → streak +1, XP bonus (scales from +2 XP at day 1 to +50 XP at day 100+)
- **Gap with shield available** → shield auto-activates silently, streak is preserved, dramatic modal shown
- **Gap with no shields** → streak resets to 1, motivational "Day 1" modal shown (not punishing)
- Idempotent — multiple opens on the same day never double-count

**Streak Shield milestones** (shields earned automatically):

| Day | Milestone Label | Shields |
|-----|----------------|---------|
| 3 | Newcomer's Protection | +1 |
| 7 | One Week Standing | +1 |
| 14 | Fortnight Warrior | +1 |
| 30 | Monthly Veteran | +1 |
| 60 | Dedicated Player | +1 |
| 100 | Century Club | +2 |
| 365 | Annual Legend | +3 |

**UI surfaces:**
- **StreakHUD** (dashboard header) — 🔥 flame counter with glow that intensifies at 7 / 14 / 30+ days + 🛡 shield counter (turns yellow at 1, red at 0); XP pop animation; milestone flash banner
- **Shield-burned modal** — two-phase overlay: dramatic animated shield → detail card with shields-remaining message and low-shield warning
- **Streak-reset modal** — motivational framing, reminder that Day 3 earns the first shield
- **StreakCard** (Overview tab) — current streak, longest ever, live shield inventory, full milestone roadmap with lock / pulse / checkmark states

**Database columns added to `dashboards`:** `streak_days`, `longest_streak`, `last_activity_date`, `streak_shields`, `shields_used_total`

### Quests
- DAILY / WEEKLY / MONTHLY / ONGOING quest types
- Progress logging with `POST /quests/:id/progress`
- XP reward on completion

### Skills
- Skill-level streaks tracked via `streak_count` + `last_checkin` per skill
- Categories: INVESTMENT / SAVINGS / KNOWLEDGE

### Budget & Wealth Tracking
- Monthly budget with planned vs. actual line items
- Wealth snapshot with asset breakdown
- Bank statement import (CSV / PDF) via `POST /api/import`

### Admin Panel
- Player management: view, edit, promote/demote, delete
- Badge and milestone management
- Quest dispatch to specific players
- Leaderboard and global stats

---

## User preferences
