## 2026-07-12 - [Missing Authentication on Admin Endpoint]
**Vulnerability:** The `/sync` endpoint in `ctftime-sync` worker triggered manual syncing of data but was missing authentication, allowing any unauthenticated user to invoke it on demand.
**Learning:** Even internal or admin utility endpoints must be protected. Cloudflare Workers do not provide default protections against endpoint invocation unless explicitly configured through environmental secrets or middleware.
**Prevention:** Always implement explicit authorization checks (e.g., verifying a secret from environment bindings against an `Authorization` header) for any endpoints exposing administrative operations or triggerable workflows.
