## 2024-05-24 - Missing Authorization on Sensitive Trigger Endpoint
**Vulnerability:** The `/sync` endpoint in the `ctftime-sync` Cloudflare Worker allowed triggering an on-demand sync of data without any authorization check, creating a potential DoS risk or unnecessary resource consumption.
**Learning:** Cloudflare Workers exposing administrative or on-demand trigger endpoints manually via HTTP paths should explicitly implement authorization checks.
**Prevention:** Verify a secret from environment bindings against an `Authorization` header on sensitive HTTP endpoints.
