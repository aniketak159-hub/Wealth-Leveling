---
name: Generated client sync
description: Covers keeping frontend API hooks aligned with the workspace OpenAPI contract.
---

The frontend expects generated API hooks that are not currently exported by the checked-in `@workspace/api-client-react` client.

**Why:** The existing app has a contract/client drift that surfaces as many missing-hook and implicit-`any` typecheck errors, even though the running API responds successfully.

**How to apply:** Before future frontend typecheck or API-surface work, regenerate the client from the OpenAPI package and then resolve any remaining contract mismatches.