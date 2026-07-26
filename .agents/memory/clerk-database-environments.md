---
name: Clerk and database environments
description: Covers how Replit-managed Clerk identities map to PostgreSQL records across development and production.
---

The application’s PostgreSQL records are owned by the Clerk user ID stored in the local `users` table. A user must sign in with the same Clerk identity to retrieve the existing financial records.

**Why:** Replit-managed Clerk keeps development/preview and production user stores isolated. The same email may need separate accounts in those environments, and a different Clerk ID correctly maps to a new local database user.

**How to apply:** When a user sees signup after a restart, direct them to the existing Sign In flow first. When moving to the published app, explain that production authentication and production database data are separate from development until the user creates/signs into a production account and the app is published with the schema.