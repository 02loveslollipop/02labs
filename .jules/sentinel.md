## 2025-06-13 - [Lack of Authorization on Administrative Sync Endpoint]
**Vulnerability:** The on-demand sync endpoint (`/sync`) in the `ctftime-sync` Cloudflare Worker was missing an authorization check, allowing any unauthenticated user to trigger manual syncing.
**Learning:** This could lead to resource exhaustion or denial of service by repeatedly triggering API calls against the external CTFtime service and writing to KV. Cloudflare Worker endpoints that serve administrative functions should always implement strong authorization.
**Prevention:** Always require an authorization token (e.g., a Bearer token mapped to a secret binding) for sensitive or trigger-based HTTP paths in Worker routing.
