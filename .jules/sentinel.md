## 2025-03-09 - Missing Authorization on Admin Sync Endpoint
**Vulnerability:** The on-demand sync endpoint `/sync` in the `ctftime-sync` Cloudflare Worker was exposed publicly without any authentication or authorization checks.
**Learning:** Cloudflare Workers exposing administrative or on-demand trigger endpoints manually via HTTP paths must explicitly implement authorization checks to prevent unauthenticated abuse or repeated triggering.
**Prevention:** Implement explicit authorization checks (e.g., checking an `Authorization` header against a secret stored in environment bindings) for any endpoint that triggers non-public state changes or expensive operations.
