## 2025-06-30 - [Missing Authorization on On-Demand Sync Endpoint]
**Vulnerability:** The on-demand sync endpoint (`/sync`) in the `ctftime-sync` Cloudflare Worker lacked any authentication or authorization checks, allowing unauthenticated users to trigger expensive external API calls and mutate the cache state.
**Learning:** Cloudflare Workers exposing administrative or on-demand trigger endpoints manually via HTTP paths need explicit authorization checks (e.g., verifying a secret from environment bindings against an `Authorization` header).
**Prevention:** Implement a check against a secret stored in environment bindings (e.g., `SYNC_SECRET`) and validate the `Authorization: Bearer <secret>` header before processing sensitive endpoints.
