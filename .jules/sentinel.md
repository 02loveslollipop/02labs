## 2025-05-24 - [Unauthenticated API Sync Endpoint in CTFTime Worker]
**Vulnerability:** The `/sync` endpoint in the `ctftime-sync` Cloudflare Worker was unauthenticated, allowing any user to trigger an on-demand synchronization with the CTFtime API.
**Learning:** This missing authentication on a sensitive endpoint can lead to abuse, exposing the external API rate-limiting restrictions and causing unnecessary writes/overwrites to the Workers KV cache.
**Prevention:** Always secure sensitive endpoints and operations (like sync actions or administration routes) by requiring a valid secret token, utilizing authorization headers, or implementing access control mechanisms when exposed publicly.
