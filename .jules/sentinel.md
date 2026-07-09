## 2025-07-09 - [Missing Authorization on On-Demand Trigger Endpoint]
**Vulnerability:** The `/sync` endpoint in the `ctftime-sync` Cloudflare Worker allowed unauthenticated on-demand triggering of data syncs from an external API, potentially leading to denial of service, rate limit exhaustion, or unexpected KV storage overwrites.
**Learning:** Manual triggers for background/cron tasks exposed via HTTP paths often lack implicit authorization protections and must explicitly implement checks against environment secrets to prevent abuse.
**Prevention:** Always implement an authorization check (e.g., verifying a `Bearer` token against a secret in `env`) for any Cloudflare Worker endpoint that performs administrative or mutation actions, even if it just triggers a sync.
