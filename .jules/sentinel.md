## 2025-07-15 - [Lack of Authorization on Manual Worker Triggers]
**Vulnerability:** A Cloudflare Worker endpoint (`/sync`) exposed a manual trigger mechanism over HTTP without any authentication or authorization checks.
**Learning:** Even utility or "sync" endpoints that perform background tasks should be protected, as unauthenticated access could be abused to cause denial of service (DoS) by spamming external APIs (like CTFtime), leading to rate limiting or blocking, or excessively consuming Worker execution time/KV write quotas.
**Prevention:** Always implement an authorization check (e.g., verifying a Bearer token against a secret environment binding) on any HTTP route that triggers resource-intensive operations or state changes.
