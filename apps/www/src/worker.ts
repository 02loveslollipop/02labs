import { createExports as createAstroExports } from "@astrojs/cloudflare/entrypoints/server.js";
import type { SSRManifest } from "astro";
import type { ExecutionContext } from "@cloudflare/workers-types";

type Env = {
	[key: string]: unknown;
	ASSETS: {
		fetch: (req: Request | string) => Promise<Response>;
	};
};

const PRIMARY_HOST = "02labs.me";
const REDIRECT_HOSTS = new Set(["02loveslollipop.uk", "www.02labs.me", "www.02loveslollipop.uk"]);

const HOMEPAGE_MARKDOWN = `# 02Labs
Systems, Data, Projects, and CTF Writeups.

02Labs is the portfolio and lab of 02loveslollipop, featuring systems engineering projects, data work, security experiments, and technical writeups.

## Featured Projects
- OpenCROW: Offensive-workflow workstation bootstrap
- MiPedido: Integrated shared ordering and ahead-order management platform
- Discord GPT Chat Bot: Python Discord bot powered by OpenAI
- Bad Apple ESP32 Utilities: High-performance developer utilities
- LoRa L298N Tank Controller: End-to-end IoT tank control system

## Links
- API Catalog: /.well-known/api-catalog
- Service Doc: /docs/api
`;

// Formerly src/middleware.ts: runs here because middleware does not execute
// for prerendered pages, and run_worker_first routes every request through
// this worker.
function getMarkdownResponse(request: Request): Response | null {
	const accept = request.headers.get("Accept");
	if (!accept || !accept.includes("text/markdown")) return null;

	const url = new URL(request.url);
	const isHomepage = url.pathname === "/";
	const markdown = isHomepage
		? HOMEPAGE_MARKDOWN
		: `# ${url.pathname}\n\nContent available in HTML.`;

	const headers: Record<string, string> = {
		"Content-Type": "text/markdown",
		"x-markdown-tokens": String(markdown.split(/\s+/).length),
		"Content-Signal": "ai-train=yes, search=yes, ai-input=yes",
	};
	if (isHomepage) {
		headers["Link"] = '</.well-known/api-catalog>; rel="api-catalog", </docs/api>; rel="service-doc"';
	}
	return new Response(markdown, { status: 200, headers });
}

// Formerly set via Astro.response in index.astro, which is prerendered now.
function withAgentLinkHeader(url: URL, response: Response): Response {
	if (url.hostname !== PRIMARY_HOST || url.pathname !== "/" || !(response.headers.get("Content-Type") ?? "").includes("text/html")) {
		return response;
	}
	const headers = new Headers(response.headers);
	headers.set("Link", '</.well-known/api-catalog>; rel="api-catalog", </docs/api>; rel="service-doc"');
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

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
	type AstroRequest = Parameters<typeof astroFetch>[0];

	return {
		...astroExports,
		default: {
			...astroExports.default,
			async fetch(request: Request, env: Env, context: ExecutionContext) {
				const redirectResponse = getRedirectResponse(request);
				if (redirectResponse) return redirectResponse;

				const markdownResponse = getMarkdownResponse(request);
				if (markdownResponse) return markdownResponse;

				const response = await astroFetch(request as unknown as AstroRequest, env, context);
				return withAgentLinkHeader(new URL(request.url), response);
			},
		},
	};
}
