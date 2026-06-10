## 2025-06-10 - Protect public endpoints causing external API abuse
**Vulnerability:** The `/sync` endpoint in the `ctftime-sync` Cloudflare Worker was unprotected and publicly accessible. Anyone could trigger it on demand, which causes an external API call to ctftime.org and updates the KV store cache. This creates a risk for resource exhaustion/abuse (rate limits on the ctftime API side) and Cloudflare bill abuse.
**Learning:** Even internal admin/sync triggers that seem harmless because they only update a public cache need authentication if they can be triggered publicly, especially when they reach out to external systems with rate limits.
**Prevention:** Add a secret API key or token verification to endpoints that perform backend actions or reach external APIs.
