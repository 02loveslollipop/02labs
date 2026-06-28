## 2025-06-28 - [Missing Authorization on Administrative Endpoint]
**Vulnerability:** The on-demand sync endpoint `/sync` in the `ctftime-sync` worker lacked authorization checks, allowing any external user to trigger syncing arbitrarily. This could lead to abuse of the downstream CTFtime API or KV storage exhaustion.
**Learning:** Even internal or administrative endpoints in Cloudflare Workers that appear hidden must explicitly implement authorization checks. It is dangerous to assume that only trusted clients will call certain paths.
**Prevention:** Always verify authorization headers against a secure environment binding (e.g., `SYNC_SECRET`) for administrative operations or on-demand triggers in worker scripts.
