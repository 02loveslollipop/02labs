/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
	CTFTIME_KV: KVNamespace;
	ASSETS: Fetcher;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}
