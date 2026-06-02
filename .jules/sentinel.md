## 2024-06-02 - [CRITICAL] Protected Unauthenticated Cloudflare Worker Sync Endpoint
**Vulnerability:** The `/sync` endpoint in the `ctftime-sync` Cloudflare Worker was completely unauthenticated, allowing anyone to trigger expensive downstream API calls and unnecessary KV writes. This creates a Denial of Service risk through downstream rate limits or increased Cloudflare worker invocation costs.
**Learning:** External or cron-job triggered "sync" endpoints must be protected if exposed over HTTP, even if they don't seem to manipulate sensitive data directly, to avoid abuse.
**Prevention:** Always add authorization checks (e.g., Bearer token checks) or restrict the endpoint to private networks using Cloudflare Access for manual trigger endpoints in workers.
