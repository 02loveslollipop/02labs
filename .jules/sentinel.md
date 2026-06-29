## 2025-02-24 - Missing Authorization on Cloudflare Worker Administrative Endpoints
**Vulnerability:** The on-demand sync endpoint (`/sync`) in the `ctftime-sync` Cloudflare Worker was exposed publicly without any authentication or authorization checks.
**Learning:** Cloudflare Workers exposing administrative or state-mutating functionality via specific HTTP paths must explicitly implement access controls, as they are otherwise accessible to anyone knowing the URL. Relying solely on cron triggers for primary execution does not protect manually exposed routes.
**Prevention:** Always implement authorization checks (e.g., verifying a secret from environment bindings via the `Authorization` header) on manually triggered operational endpoints to prevent abuse or unauthorized execution.
