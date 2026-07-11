## 2026-07-11 - [Unauthenticated Admin/Sync Endpoint]
**Vulnerability:** The `/sync` endpoint in the `ctftime-sync` Cloudflare Worker was missing authentication, allowing anyone to trigger on-demand syncs.
**Learning:** Cloudflare Workers exposing administrative or on-demand trigger endpoints manually via HTTP paths need explicit authorization checks.
**Prevention:** Always verify a secret from environment bindings against an `Authorization` header or similar mechanism for sensitive endpoints.
