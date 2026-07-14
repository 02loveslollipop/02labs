
## 2024-07-14 - [Secured Cloudflare Worker On-Demand Sync Endpoint]
**Vulnerability:** The `/sync` endpoint for the `ctftime-sync` Cloudflare Worker was exposed without any authentication. This allowed anyone to trigger the on-demand sync, potentially leading to unauthorized operations and abuse of the CTFtime API limits via an unauthenticated trigger.
**Learning:** Cloudflare Workers exposing administrative or on-demand trigger endpoints manually via HTTP paths should explicitly implement authorization checks. Relying on obscurity for such paths is insufficient for security.
**Prevention:** Always secure administrative or internal trigger endpoints using secret tokens (e.g., verifying a secret from environment bindings against an `Authorization` header) or appropriate authentication mechanisms.
