---
name: Cold-start library build
description: Build-order constraint for shared TypeScript declarations in fresh monorepo imports.
---

Shared libraries are a prerequisite for the API and frontend typechecks: their generated declaration files may be absent on a fresh import even though they existed in a previously cached workspace.

**Why:** The leaf packages consume emitted declarations from composite libraries, so independent API or frontend checks can fail before the libraries have been built.

**How to apply:** Run the root shared-library build before dependent checks, and keep fresh-environment setup responsible for materializing those declarations rather than relying on cached `dist/` output.