## 2025-03-04 - [Missing Authorization on Worker Trigger Endpoint]
**Vulnerability:** The on-demand `/sync` endpoint in the `ctftime-sync` Cloudflare Worker was exposed without any authorization checks, allowing unauthenticated users to trigger sync actions.
**Learning:** Even internal or administrative endpoints in serverless workers must have explicitly defined and implemented authorization checks. Environment variables and bindings are effectively local to the execution context, so an explicit check against a secret passed via headers or parameters is necessary to secure these endpoints.
**Prevention:** Always implement an authorization check using a secret from the worker's environment bindings against incoming requests for any non-public administrative or trigger endpoint.
