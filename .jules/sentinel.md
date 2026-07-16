## 2024-07-14 - [Secured Cloudflare Worker On-Demand Sync Endpoint]
**Vulnerability:** The `/sync` endpoint for the `ctftime-sync` Cloudflare Worker was exposed without any authentication. This allowed anyone to trigger the on-demand sync, potentially leading to unauthorized operations and abuse of the CTFtime API limits via an unauthenticated trigger.
**Learning:** Cloudflare Workers exposing administrative or on-demand trigger endpoints manually via HTTP paths should explicitly implement authorization checks. Relying on obscurity for such paths is insufficient for security.
**Prevention:** Always secure administrative or internal trigger endpoints using secret tokens (e.g., verifying a secret from environment bindings against an `Authorization` header) or appropriate authentication mechanisms.

## 2025-05-30 - [Overly Permissive CORS Configuration]
**Vulnerability:** The Cloudflare worker in `workers/ctftime-sync` had a CORS policy with `Access-Control-Allow-Origin: *`.
**Learning:** This is a high-priority vulnerability because it allows any website to read data from the API endpoint. While this API might serve public data, it was intended to be used specifically by `02labs.me` according to comments in the code.
**Prevention:** Explicitly restrict `Access-Control-Allow-Origin` to trusted origins instead of using the wildcard `*`.

