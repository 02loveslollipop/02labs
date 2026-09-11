/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
	ASSETS: Fetcher;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}
