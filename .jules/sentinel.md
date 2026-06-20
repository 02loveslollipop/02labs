## 2025-03-05 - Missing Authorization on Admin Endpoints
**Vulnerability:** The `/sync` endpoint in the `ctftime-sync` Cloudflare Worker was missing authorization checks, exposing an administrative, on-demand sync mechanism to the public. This could lead to resource exhaustion and triggering of external API rate limits.
**Learning:** Cloudflare Workers exposing administrative endpoints manually via HTTP paths must explicitly implement their own authorization logic. There is no built-in protection by simply defining a route.
**Prevention:** Explicitly implement authorization checks (e.g., verifying a secret from environment bindings against an `Authorization` header) for any endpoints that trigger state changes, backend syncs, or administrative actions.
