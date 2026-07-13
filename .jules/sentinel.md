## 2024-05-18 - Missing Authorization on Admin Endpoints
**Vulnerability:** The `/sync` endpoint in the `ctftime-sync` Cloudflare Worker was exposed without any authorization checks, allowing anyone to trigger an on-demand synchronization.
**Learning:** Cloudflare Workers exposing administrative or on-demand trigger endpoints manually via HTTP paths must explicitly implement authorization checks. Relying solely on obscurity (knowing the path) is insufficient for security.
**Prevention:** Always require an authorization token (e.g., via the `Authorization` header) backed by environment bindings for administrative or sensitive endpoints in Cloudflare Workers, and explicitly validate it before processing requests.
