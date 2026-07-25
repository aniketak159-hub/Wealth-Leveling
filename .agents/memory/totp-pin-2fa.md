---
name: TOTP on PIN login
description: TOTP (RFC 6238) implemented as a second factor specifically on PIN login. Architecture decisions and esbuild quirks.
---

## Rule
TOTP is the second factor for PIN login only, not for Clerk's standard auth (Replit-managed Clerk does not support MFA today).

**Why:** PIN login bypasses Clerk's normal auth flow entirely — email+PIN issues a Clerk sign-in token directly. Without a second factor, a stolen PIN gives full account access. TOTP on PIN closes this gap.

**How to apply:** When a user has `totpEnabled = true` in `usersTable`, `POST /api/auth/pin-login` returns `{ requiresTotp: true }` (200) when no `totpCode` is provided. The frontend `PinLoginFlow.tsx` detects this and shows a TOTP step. The second submission includes `{ email, pin, totpCode }` and the backend verifies all three before issuing the Clerk token.

## esbuild quirk — otplib + qrcode
`otplib` v13 and `qrcode` cannot be bundled by esbuild as named ESM imports — esbuild can't statically analyze their exports. Fix: add both to the `external` array in `artifacts/api-server/build.mjs`, then `require()` them in the source file. The build.mjs banner already injects `globalThis.require` so externalised CJS packages load correctly at runtime.

**Import pattern in pin.ts:**
```typescript
const { authenticator } = require("otplib") as typeof import("otplib");
const QRCode = require("qrcode") as typeof import("qrcode");
```

## DB columns added to usersTable
- `totpSecret: text("totp_secret")` — stores the TOTP secret (set on setup, cleared on disable)
- `totpEnabled: boolean("totp_enabled").notNull().default(false)` — activation gate; secret is stored before enabled=true
