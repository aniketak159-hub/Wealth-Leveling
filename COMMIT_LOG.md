# 📋 Commit Log — Wealth Leveling

All commits recorded in reverse-chronological order (newest first).
Generated from `git log --all` on **2026-07-26**.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✨ | New feature |
| 🐛 | Bug fix |
| 🔧 | Configuration / tooling |
| 📄 | Documentation |
| 🔐 | Security / authentication |
| 🏗 | Architecture / refactor |
| 🌱 | Data / seeding |
| 🚀 | Initial setup / project bootstrap |

---

## Commits

---

### `c6a1cd0` · 2026-07-26 12:00 UTC
**Author:** Replit Agent
**Message:** Update documentation and refactor admin route logic

📄 ✨ 🏗

#### What changed
- **README.md** — full rewrite: monorepo architecture, all 14 API route groups, database schema table, security section (PIN + TOTP), bank statement import, codegen pipeline, Clerk environment isolation note
- **OpenAPI spec (`lib/api-spec/openapi.yaml`)** — added 10 missing admin endpoints: `POST /admin/quests/push`, full CRUD for `/admin/badges` and `/admin/milestones`, including path-param routes `/{id}`
- **Admin server route (`artifacts/api-server/src/routes/admin.ts`)** — aligned import names to match orval-generated zod schema names (`AdminCreateBadgeResponse`, `AdminUpdateBadgeResponse`, `AdminCreateMilestoneResponse`, `AdminUpdateMilestoneResponse`)
- **PIN server route (`artifacts/api-server/src/routes/pin.ts`)** — replaced `SetPinBody` import with codegen-correct `CreatePinBody`; fixed `SetPinBody.safeParse` call to match
- **`lib/api-zod/src/index.ts`** — removed duplicate `export *` lines and dropped hand-written `./pin` re-export (now fully served by generated code)
- **Codegen output regenerated** — `lib/api-client-react/src/generated/api.ts` (+661 lines), `lib/api-zod/src/generated/api.ts` (+206 lines), 27 new type files under `lib/api-zod/src/generated/types/`

#### Files touched
`README.md` · `lib/api-spec/openapi.yaml` · `artifacts/api-server/src/routes/admin.ts` · `artifacts/api-server/src/routes/pin.ts` · `lib/api-zod/src/index.ts` · `lib/api-client-react/src/generated/api.ts` · `lib/api-client-react/src/generated/api.schemas.ts` · `lib/api-zod/src/generated/api.ts` · `lib/api-zod/src/generated/types/` (27 files)

**28 files changed · +1863 / −192**

---

### `ade4ea5` · 2026-07-26 12:00 UTC
**Author:** Replit Agent
**Message:** Update documentation and refactor admin route logic

> *Parallel checkpoint recorded at the same timestamp as `c6a1cd0` during the same agent session. Resolves to the same tree.*

---

### `830545c` · 2026-07-26 11:48 UTC
**Author:** aniketak159-hub
**Message:** Pin Update

🔐 ✨

#### What changed
- **OpenAPI spec** — added all 9 PIN / TOTP authentication endpoints to `lib/api-spec/openapi.yaml`:
  - `GET /users/me/pin-status`
  - `POST /users/me/pin`, `PUT /users/me/pin`, `DELETE /users/me/pin`
  - `GET /auth/totp/status`, `POST /auth/totp/setup`, `POST /auth/totp/enable`, `DELETE /auth/totp/disable`
  - `POST /auth/pin-login`
- **New OpenAPI schemas** — `PinStatus`, `CreatePinInput`, `ChangePinInput`, `DeletePinInput`, `TotpStatus`, `TotpSetupResult`, `TotpCodeInput`, `PinLoginInput`, `PinLoginResult`, `SuccessResponse`
- **Codegen re-run** — generated 15 new type files under `lib/api-zod/src/generated/types/` and expanded `api.ts` in both `api-client-react` and `api-zod`
- Added `auth` tag to OpenAPI tag list

#### Files touched
`lib/api-spec/openapi.yaml` · `lib/api-client-react/src/generated/api.schemas.ts` · `lib/api-client-react/src/generated/api.ts` · `lib/api-zod/src/generated/api.ts` · `lib/api-zod/src/generated/types/` (15 new files) · `lib/api-zod/src/index.ts`

**16 files changed · +1278 / −361**

---

### `7a33a9e` · 2026-07-26 11:42 UTC
**Author:** Replit Agent
**Message:** Implement authentication logic and update agent documentation and environment configuration

🔐 🔧

#### What changed
- **`artifacts/api-server/src/middlewares/auth.ts`** — hardened `requireAuth` middleware: now loads the full `dbUser` row from PostgreSQL and attaches it to `req.dbUser` so all downstream route handlers have immediate access to the user record without re-querying
- **`.replit`** — workflow configuration adjusted
- **`.agents/memory/`** — added `clerk-database-environments.md` memory file documenting that Clerk dev and production tenants are separate user stores; PostgreSQL rows are keyed by Clerk user IDs

#### Files touched
`artifacts/api-server/src/middlewares/auth.ts` · `.replit` · `.agents/memory/MEMORY.md` · `.agents/memory/clerk-database-environments.md`

**4 files changed · +26 / −3**

---

### `3864664` · 2026-07-26 11:32 UTC
**Author:** Replit Agent
**Message:** Update replit configuration

🔧

#### What changed
- Minor `.replit` workflow configuration update

**1 file changed · +1 / −1**

---

### `525ebab` · 2026-07-26 11:25 UTC
**Author:** aniketak159-hub
**Message:** Add safeFloat utility: harden all financial field parsing against NaN/null across API + frontend

🐛 🏗

#### What changed
- **New utility `artifacts/api-server/src/lib/numbers.ts`** — `safeFloat(value, fallback)` helper that safely parses Drizzle numeric columns (returned as strings) to floats, guarding against `NaN`, `null`, and `undefined`
- **`routes/budget.ts`** — replaced raw `parseFloat()` calls with `safeFloat`; fixed edge cases where null transaction amounts produced `NaN` in responses
- **`routes/dashboard.ts`** — applied `safeFloat` to `netWorth`, `totalAssets`, and stat fields
- **`routes/quests.ts`** — applied `safeFloat` to `targetAmount` and `currentAmount`
- **`routes/wealth.ts`** — applied `safeFloat` to asset `amount` fields
- **`Dashboard.tsx`** — guarded client-side percentage calculations against division-by-zero when totals are zero

#### Files touched
`artifacts/api-server/src/lib/numbers.ts` · `artifacts/api-server/src/routes/budget.ts` · `artifacts/api-server/src/routes/dashboard.ts` · `artifacts/api-server/src/routes/quests.ts` · `artifacts/api-server/src/routes/wealth.ts` · `artifacts/wealth-levels/src/pages/Dashboard.tsx`

**6 files changed · +50 / −26**

---

### `9362c42` · 2026-07-26 11:21 UTC
**Author:** aniketak159-hub
**Message:** Add global error handler + consistent Zod param validation on all mutation endpoints

🐛 🏗

#### What changed
- **`artifacts/api-server/src/app.ts`** — registered a global Express error-handling middleware (4-argument `(err, req, res, next)`) that catches unhandled errors and returns a structured `{ error: string }` JSON response with HTTP 500, replacing silent crashes
- **`routes/budget.ts`** — added Zod `.safeParse()` validation on `PATCH /budget` and `POST /budget/transactions` request bodies, returning 400 with the first validation error message instead of passing malformed data to Drizzle

#### Files touched
`artifacts/api-server/src/app.ts` · `artifacts/api-server/src/routes/budget.ts`

**2 files changed · +31 / −6**

---

### `6093e37` · 2026-07-26 06:21 UTC
**Author:** aniketak159-hub
**Message:** Fix stat allocation: cache invalidation on commit, evaluation grants min 1 unspent point per eval (3 per level gained)

🐛

#### What changed
- **`routes/dashboard.ts`** — `POST /dashboard/evaluation` now guarantees a minimum of **1 unspent stat point** per evaluation pass; when the hunter levels up during evaluation, exactly **3 bonus points** are granted per level gained
- **`components/dashboard/StatsTab.tsx`** — after a successful stat allocation commit (`PATCH /dashboard/stats`), the React Query cache is explicitly invalidated for `getDashboard` so the character sheet re-fetches immediately without a page refresh
- **`scripts/seed-test-user/data.json`** — updated seed snapshot to reflect the corrected stat allocation values

#### Files touched
`artifacts/api-server/src/routes/dashboard.ts` · `artifacts/wealth-levels/src/components/dashboard/StatsTab.tsx` · `scripts/seed-test-user/data.json` · `attached_assets/image_1785046559535.png`

**4 files changed · +62 / −29**

---

### `a08d42c` · 2026-07-25 18:10 UTC
**Author:** Replit Agent
**Message:** Update replit configuration file

🔧

> Minor `.replit` configuration update recorded during setup.

**1 file changed · +1 / −1**

---

### `74397d2` · 2026-07-25 18:10 UTC
**Author:** Replit Agent
**Message:** Update replit configuration file

🔧

> Parallel checkpoint at the same timestamp as `a08d42c`.

**1 file changed · +1 / −1**

---

### `1472349` · 2026-07-25 12:33 UTC
**Author:** Xoyav80800
**Message:** Quest system: Create Quest dialog, SELF/SYSTEM boards, completed log, financial data sync, sample quests

✨

#### What changed
- **`routes/quests.ts`** — extended quest API: `POST /quests` now accepts full quest payload with `category`, `targetAmount`, `xpReward`, and `frequency`; added `PATCH /quests/:id/progress` endpoint to log incremental progress toward a target amount
- **`components/dashboard/QuestsTab.tsx`** (686 → ~1300 lines) — full UI overhaul:
  - **Two-board layout** — SELF quests (user-created) and SYSTEM quests (admin-pushed) displayed in separate columns
  - **Create Quest dialog** — form with title, description, category, target amount, XP reward, and recurrence cadence
  - **Completed quest log** — collapsible section showing finished quests with XP earned
  - **Financial data sync** — quest progress can reference live budget/wealth figures
  - **Sample quests** — default starter quests injected for new users
- **`lib/db/src/schema/quests.ts`** — added `frequency` column (`DAILY | WEEKLY | MONTHLY | ONGOING`) to the quests table
- **`lib/api-client-react/src/generated/api.schemas.ts`** and **`lib/api-zod/src/generated/api.ts`** — regenerated to reflect the new `frequency` field in quest schemas
- **`scripts/seed-test-user/data.json`** — updated seed data with sample quests including categories and frequency values

#### Files touched
`artifacts/api-server/src/routes/quests.ts` · `artifacts/wealth-levels/src/components/dashboard/QuestsTab.tsx` · `lib/db/src/schema/quests.ts` · `lib/api-client-react/src/generated/api.schemas.ts` · `lib/api-zod/src/generated/api.ts` · `scripts/seed-test-user/data.json` · `scripts/seed-test-user/export.mjs` · `scripts/seed-test-user/restore.mjs` · `attached_assets/image_1784981850439.png`

**9 files changed · +818 / −86**

---

### `9ced307` · 2026-07-25 12:11 UTC
**Author:** Replit Agent
**Message:** Update test user data seed file

🌱

#### What changed
- Minor correction to `scripts/seed-test-user/data.json` — patched a single-field inconsistency in the test user's quest data

**1 file changed · +1 / −1**

---

### `02cbfea` · 2026-07-25 12:11 UTC
**Author:** Xoyav80800
**Message:** Auto-seed test user on every setup via post-merge.sh

🌱 🔧

#### What changed
- **`scripts/post-merge.sh`** — added automatic invocation of the `restore.mjs` seed script on every post-merge setup run, so the test user's data (quests, skills, dashboard stats, wealth, budget) is always present in a fresh environment
- **`replit.md`** — documented the post-merge seed behaviour and the test user's email / scope

#### Files touched
`scripts/post-merge.sh` · `replit.md`

**2 files changed · +31 insertions**

---

### `c88f249` · 2026-07-25 12:06 UTC
**Author:** Xoyav80800
**Message:** Add test user backup and restore scripts for jagruthi1221@gmail.com

🌱 🔧

#### What changed
- **`scripts/seed-test-user/export.mjs`** — new script that dumps all data for a given user (dashboard, wealth, budget, quests, skills, builds) to `data.json`
- **`scripts/seed-test-user/restore.mjs`** — new script that reads `data.json` and upserts all records into the database, enabling reproducible test environments
- **`scripts/seed-test-user/data.json`** — initial seed snapshot for the test account
- **`scripts/package.json`** — added `export` and `restore` script entries; added `pg` dependency for direct PostgreSQL access

#### Files touched
`scripts/seed-test-user/export.mjs` · `scripts/seed-test-user/restore.mjs` · `scripts/seed-test-user/data.json` · `scripts/package.json` · `pnpm-lock.yaml`

**5 files changed · +394 insertions**

---

### `3473a34` · 2026-07-25 11:58 UTC
**Author:** Xoyav80800
**Message:** Restore postgresql-16 module and add mockup sandbox to run button workflow

🔧

#### What changed
- **`.replit`** — re-added `postgresql-16` to the Nix module list (had been accidentally dropped); added the `mockup-sandbox` workflow to the Replit Run button so all three services start together

**1 file changed · +5 / −1**

---

### `b8952d8` · 2026-07-25 11:52 UTC
**Author:** Replit Agent
**Message:** Update replit configuration file

🔧

> Automated configuration checkpoint recorded during initial environment setup.

**1 file changed · +1 / −1**

---

### `7a25259` · 2026-07-25 11:26 UTC
**Author:** Replit Agent
**Message:** Add image to attached assets *(Initial project import)*

🚀

#### What changed
Full project bootstrapped and imported into the Replit monorepo. This commit contains the entire Wealth Leveling codebase:

**Monorepo structure**
- `pnpm-workspace.yaml` — workspace root configuration listing all packages
- `package.json`, `tsconfig.base.json`, `tsconfig.json` — root build and type-check configuration
- `replit.nix` — Nix environment with Node 20 and PostgreSQL 16

**Frontend — `artifacts/wealth-levels`**
- Full React 18 + Vite + Tailwind + Radix UI application
- Pages: `Home`, `Dashboard`, `Admin`, `Profile`, `Security`, `Privacy`, `Terms`, `not-found`
- Dashboard tabs: Stats, Quests, Skills, Budget, Wealth, Builds, Evaluation, Import
- Components: `TechBootLoader`, `LevelUpCinematic`, `PinLoginFlow`, `PinSetupModal`, `TotpCard`, `BankConnectPanel`, `ImportStatementModal`, `EvaluationModal`
- Clerk sign-in/sign-up pages with Solo Leveling theming

**Backend — `artifacts/api-server`**
- Express + TypeScript API server built with esbuild
- 14 route modules: `health`, `users`, `dashboard`, `quests`, `skills`, `skill-tree`, `streak`, `builds`, `budget`, `wealth`, `import`, `pin`, `admin`, `aa`
- Auth middleware (`requireAuth`, `requireAdmin`) using `@clerk/express`
- PIN + TOTP authentication (`bcryptjs`, `otplib`, `qrcode`)
- Bank statement parser supporting 7 Indian banks

**Shared libraries — `lib/`**
- `lib/db` — Drizzle ORM + PostgreSQL schema (13 tables: `users`, `dashboards`, `wealth`, `wealth_assets`, `budgets`, `budget_items`, `transactions`, `quests`, `skills`, `skill_tree_unlocks`, `badges`, `milestones`, `builds`)
- `lib/api-spec` — OpenAPI 3.1 spec (`openapi.yaml`) + Orval codegen config
- `lib/api-client-react` — generated TanStack Query hooks + `customFetch` client
- `lib/api-zod` — generated Zod validation schemas + hand-written PIN schemas

**Scripts — `scripts/`**
- `scripts/post-merge.sh` — post-merge setup hook
- `scripts/src/hello.ts` — placeholder entry point

**Screenshots**
- `screenshots/` — reference images: home landing, dashboard, sign-in, sign-up, admin panel, profile, wealth dashboard, boot loader

**328 files changed · +41,813 insertions**

---

## Summary Statistics

| Date | Commits | Files Changed | Lines Added | Lines Removed |
|------|---------|---------------|-------------|---------------|
| 2026-07-25 | 8 | ~340 | ~42,650 | ~90 |
| 2026-07-26 | 9 | ~65 | ~2,310 | ~620 |
| **Total** | **17** | **~405** | **~44,960** | **~710** |

## Contributors

| Author | Commits | Role |
|--------|---------|------|
| Replit Agent | 9 | Automated tooling, config, codegen, documentation |
| aniketak159-hub | 4 | Feature development, bug fixes, hardening |
| Xoyav80800 | 4 | Feature development, quest system, dev tooling |
