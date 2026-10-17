// Cloudflare Pages advanced-mode worker.
// Copied to dist/_worker.js by the build hook in astro.config.mjs, where Pages
// picks it up as the single-file advanced-mode Worker and runs it for EVERY
// request (including static assets) — the only way to run logic before static
// serving on Pages. It serves the static site through env.ASSETS and applies:
//   - legacy-host redirects (www / .uk -> apex 02labs.me)
//   - the markdown-for-agents negotiation (Accept: text/markdown)
//   - security headers, plus the homepage agent Link header
// This replaces the former Worker entry and won't work without the ASSETS
// binding that Pages provides to advanced-mode Workers.

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

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// Legacy host redirects, preserving path and query.
		if (REDIRECT_HOSTS.has(url.hostname)) {
			url.protocol = "https:";
			url.host = PRIMARY_HOST;
			return Response.redirect(url.toString(), 301);
		}

		// Markdown-for-agents negotiation before touching the static assets.
		const accept = request.headers.get("Accept");
		if (accept && accept.includes("text/markdown")) {
			const isHomepage = url.pathname === "/";
			const body = isHomepage
				? HOMEPAGE_MARKDOWN
				: `# ${url.pathname}\n\nContent available in HTML.`;

			const headers = {
				"Content-Type": "text/markdown",
				"X-Content-Type-Options": "nosniff",
				"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
				"x-markdown-tokens": String(body.split(/\s+/).length),
				"Content-Signal": "ai-train=yes, search=yes, ai-input=yes",
			};
			if (isHomepage) {
				headers["Link"] = '</.well-known/api-catalog>; rel="api-catalog", </docs/api>; rel="service-doc"';
			}
			return new Response(body, { status: 200, headers });
		}

		// Serve the static site, then add security headers (+ homepage Link).
		const response = await env.ASSETS.fetch(request);
		const newResponse = new Response(response.body, response);
		newResponse.headers.set("X-Content-Type-Options", "nosniff");
		newResponse.headers.set("X-Frame-Options", "DENY");
		newResponse.headers.set("X-XSS-Protection", "1; mode=block");
		newResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
		newResponse.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

		if (
			url.hostname === PRIMARY_HOST &&
			url.pathname === "/" &&
			(response.headers.get("Content-Type") ?? "").includes("text/html")
		) {
			newResponse.headers.set(
				"Link",
				'</.well-known/api-catalog>; rel="api-catalog", </docs/api>; rel="service-doc"'
			);
		}
		return newResponse;
	},
};
