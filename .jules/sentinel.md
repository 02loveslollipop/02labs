## 2024-06-25 - Missing Authentication on Cloudflare Worker Administrative Endpoints
**Vulnerability:** The on-demand synchronization endpoint (`/sync`) for the `ctftime-sync` Cloudflare Worker was exposed publicly without any form of authentication or authorization checks.
**Learning:** Cloudflare Workers exposing administrative or on-demand trigger endpoints manually via HTTP paths require explicit authorization checks. Otherwise, anyone can trigger these endpoints, potentially leading to API rate limit exhaustion or unintended resource consumption.
**Prevention:** Always implement authorization checks for administrative or internal endpoints in Cloudflare Workers, for instance by verifying a secret from environment bindings against an `Authorization` header.
