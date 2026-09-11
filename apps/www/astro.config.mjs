// @ts-check
import { rmSync, readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import oneMonokaiTheme from './src/styles/one-monokai-theme.json' with { type: 'json' };

/** @type {import('shiki').ThemeRegistrationRaw} */
const oneMonokaiShikiTheme = {
	...oneMonokaiTheme,
	type: 'dark',
};

// The site is fully static on Cloudflare Pages. The Astro build always emits
// dist/_worker.js/ (adapter SSR server) plus dist/_routes.json and dist/_headers.json;
// a `_routes.json` in the output tells Pages to use the Functions route model,
// which disables the advanced-mode Worker we need. So we remove those adapter
// artifacts and install a single-file advanced-mode Worker (pages-worker.js)
// that serves the static site via env.ASSETS and adds the redirects, markdown
// negotiation, and security headers.
const installPagesWorker = () => ({
	name: 'install-pages-worker',
	hooks: {
		'astro:build:done'() {
			rmSync(new URL('./dist/_worker.js', import.meta.url), { recursive: true, force: true });
			rmSync(new URL('./dist/_routes.json', import.meta.url), { force: true });
			rmSync(new URL('./dist/_headers.json', import.meta.url), { force: true });
			writeFileSync(
				new URL('./dist/_worker.js', import.meta.url),
				readFileSync(new URL('./pages-worker.js', import.meta.url)),
			);
		},
	},
});

// https://astro.build/config
export default defineConfig({
	site: 'https://02labs.me',
	output: 'static',
	adapter: cloudflare({
		platformProxy: { enabled: true },
		imageService: "compile",
	}),
	trailingSlash: 'always',
	integrations: [
		sitemap({
			customPages: ['https://02labs.me/'],
		}),
		installPagesWorker(),
	],
	markdown: {
		remarkPlugins: [remarkGfm, remarkMath],
		rehypePlugins: [rehypeKatex],
		shikiConfig: {
			theme: oneMonokaiShikiTheme,
		},
	},
});
