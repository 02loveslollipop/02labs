## 2025-05-29 - Missing Authorization on Trigger Endpoints
**Vulnerability:** The `/sync` endpoint in the `ctftime-sync` Cloudflare Worker was fully unauthenticated. Anyone could trigger the sync process, making arbitrary numbers of external API calls to CTFTime and consuming Cloudflare KV write quotas.
**Learning:** Even internal or admin trigger endpoints need authorization, especially when they execute external API calls or expensive operations. Relying on obscurity (just not linking to `/sync`) is insufficient.
**Prevention:** Always require authentication (e.g., via `Authorization: Bearer <token>` or a custom secret header) for endpoints that trigger administrative or high-cost tasks, using environment secrets.
