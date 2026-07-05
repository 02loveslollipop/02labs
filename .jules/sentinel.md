## 2024-07-06 - [Missing Authentication on Admin/Sync Endpoint]
**Vulnerability:** The on-demand sync endpoint (`/sync`) in the `ctftime-sync` Cloudflare Worker was exposed publicly without authentication, allowing anyone to trigger external API calls and KV writes.
**Learning:** Administrative or on-demand trigger endpoints in Cloudflare Workers need explicit authorization checks, typically using environment variable bindings compared against an `Authorization` header.
**Prevention:** Always require an authorization secret (e.g., Bearer token) for endpoints that trigger expensive operations, modify state, or are intended for administrative use.
