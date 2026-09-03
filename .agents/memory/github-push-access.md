---
name: GitHub push access
description: Workspace-specific behavior when syncing a public GitHub repository
---

The workspace can clone a public GitHub repository over HTTPS without credentials, but pushes to GitHub require an authorized GitHub connection. Do not ask the user to paste a token; use the secure GitHub connection flow.

**Why:** Anonymous read access succeeded while HTTPS push authentication failed during repository reconciliation.

**How to apply:** If a future push fails with “Invalid username or token,” check for an authorized GitHub integration before changing remotes or attempting a force push.