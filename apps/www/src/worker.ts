import { createExports as createAstroExports } from "@astrojs/cloudflare/entrypoints/server.js";
import type { SSRManifest } from "astro";
import type { ExecutionContext } from "@cloudflare/workers-types";

type Env = {
	[key: string]: unknown;
	ASSETS: {
		fetch: (req: Request | string) => Promise<Response>;
	};
};

const PRIMARY_HOST = "02loveslollipop.uk";
const REDIRECT_HOSTS = new Set(["02labs.me", "www.02labs.me", "www.02loveslollipop.uk"]);

function getRedirectResponse(request: Request): Response | null {
	const url = new URL(request.url);
	if (!REDIRECT_HOSTS.has(url.hostname)) return null;

	url.protocol = "https:";
	url.host = PRIMARY_HOST;
	return Response.redirect(url.toString(), 301);
}

export function createExports(manifest: SSRManifest) {
	const astroExports = createAstroExports(manifest);
	const astroFetch = astroExports.default.fetch;

	return {
		...astroExports,
		default: {
			...astroExports.default,
			fetch(request: Request, env: Env, context: ExecutionContext) {
				return getRedirectResponse(request) ?? astroFetch(request, env, context);
			},
		},
	};
}
