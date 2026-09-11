## 2024-07-14 - [Secured Cloudflare Worker On-Demand Sync Endpoint]
**Vulnerability:** The `/sync` endpoint for the `ctftime-sync` Cloudflare Worker was exposed without any authentication. This allowed anyone to trigger the on-demand sync, potentially leading to unauthorized operations and abuse of the CTFtime API limits via an unauthenticated trigger.
**Learning:** Cloudflare Workers exposing administrative or on-demand trigger endpoints manually via HTTP paths should explicitly implement authorization checks. Relying on obscurity for such paths is insufficient for security.
**Prevention:** Always secure administrative or internal trigger endpoints using secret tokens (e.g., verifying a secret from environment bindings against an `Authorization` header) or appropriate authentication mechanisms.

## 2025-05-30 - [Overly Permissive CORS Configuration]
**Vulnerability:** The Cloudflare worker in `workers/ctftime-sync` had a CORS policy with `Access-Control-Allow-Origin: *`.
**Learning:** This is a high-priority vulnerability because it allows any website to read data from the API endpoint. While this API might serve public data, it was intended to be used specifically by `02labs.me` according to comments in the code.
**Prevention:** Explicitly restrict `Access-Control-Allow-Origin` to trusted origins instead of using the wildcard `*`.


## 2025-05-30 - [Secured JSON-LD XSS Vulnerability]
**Vulnerability:** Passing unsanitized strings (like JSON stringified data) directly into Astro's `set:html` inside a `<script>` tag can lead to XSS. If an attacker controls the data (e.g. user input in JSON-LD fields), they could inject `</script><script>alert(1)</script>`, which the browser will parse as a closing tag, executing the malicious payload.
**Learning:** Even when serializing objects using `JSON.stringify`, output is not automatically HTML-safe. The `set:html` directive blindly injects the content, bypassing Astro's normal text escaping mechanisms, making it dangerous for script contents.
**Prevention:** Always sanitize JSON structures before injecting them into HTML context via `set:html`. For `<script>` contexts, explicitly replace `<` and `>` characters with their unicode equivalents (`\u003c` and `\u003e`) to prevent script breakout attacks.
## 2024-09-04 - [Fix Timing Attack in Worker Authorization]
**Vulnerability:** The `/sync` endpoint in the `ctftime-sync` Cloudflare Worker used a simple string comparison (`!==`) to check the authorization header against the secret `SYNC_SECRET`. This string comparison can short-circuit, potentially leaking the secret's characters through a timing attack.
**Learning:** In environments where Node's `crypto.timingSafeEqual` or `crypto.subtle.timingSafeEqual` are not available for simple string comparison (like Cloudflare Workers), we need to manually perform a constant-time comparison.
**Prevention:** Implement a custom `timingSafeEqual` function using `TextEncoder` and bitwise XOR (`^`), and use it to compare string secrets in authorization checks.
