## 2025-07-07 - [Missing Authorization on Administrative /sync Endpoint]
**Vulnerability:** The `/sync` endpoint in the `ctftime-sync` Cloudflare Worker allowed unauthenticated on-demand syncing of external API data.
**Learning:** Even if an endpoint just triggers a background process or updates cache data, if it performs an external API request on-demand, exposing it publicly opens it up to abuse (e.g. DoS by triggering excessive external API calls, or depleting worker/API quota). Administrative endpoints must be protected.
**Prevention:** Always implement an authorization check (e.g., verifying a secret token via `Authorization` header and environment bindings) for endpoints that trigger administrative actions or external queries.
