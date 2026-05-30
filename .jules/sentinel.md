## 2025-05-30 - [Overly Permissive CORS Configuration]
**Vulnerability:** The Cloudflare worker in `workers/ctftime-sync` had a CORS policy with `Access-Control-Allow-Origin: *`.
**Learning:** This is a high-priority vulnerability because it allows any website to read data from the API endpoint. While this API might serve public data, it was intended to be used specifically by `02labs.me` according to comments in the code.
**Prevention:** Explicitly restrict `Access-Control-Allow-Origin` to trusted origins instead of using the wildcard `*`.
