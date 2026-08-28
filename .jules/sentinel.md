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

## 2024-05-15 - [Constant-Time Comparison for Secrets]
**Vulnerability:** Comparing secret strings (like API keys or tokens) using standard equality operators (`===` or `!==`) allows for timing attacks. The time it takes to compare strings reveals information about how many characters matched, allowing an attacker to guess the secret character by character.
**Learning:** `crypto.subtle.timingSafeEqual` and Node's `crypto.timingSafeEqual` are not always available or straightforward to use for simple string comparisons in Cloudflare Workers.
**Prevention:** Implement a custom constant-time comparison function using `TextEncoder` and bitwise XOR operations on the resulting byte arrays to securely compare string secrets without revealing timing information.
