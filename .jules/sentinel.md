## 2025-02-24 - [Missing Authorization on Administrative Worker Endpoints]
**Vulnerability:** The Cloudflare Worker `ctftime-sync` exposed an administrative `/sync` endpoint that forced a cache refresh via an HTTP GET request without any authorization check.
**Learning:** Cloudflare Workers exposing administrative or on-demand trigger endpoints manually via HTTP paths (such as triggering a cron job task manually) must not be accessible to anyone.
**Prevention:** Explicitly implement authorization checks (e.g., verifying a secret from environment bindings against an `Authorization` header) before allowing execution of administrative logic.
