## 2025-02-28 - [Add authorization check to on-demand sync endpoint]
**Vulnerability:** Missing authorization check on the `/sync` endpoint in the `ctftime-sync` Cloudflare Worker, allowing unauthenticated on-demand data syncing which can be abused to bypass rate limits or DoS the CTFtime API or Worker.
**Learning:** Cloudflare Workers exposing cron endpoints manually via HTTP paths need explicitly implemented authorization checks.
**Prevention:** Always require authentication via `Authorization` headers or secret tokens when exposing administrative or trigger-based HTTP endpoints.
