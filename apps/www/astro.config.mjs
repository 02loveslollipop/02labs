// @ts-check
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

// https://astro.build/config
export default defineConfig({
	site: 'https://02labs.me',
	output: 'static',
	adapter: cloudflare({
		platformProxy: { enabled: true },
		imageService: "compile",
		workerEntryPoint: { path: "./src/worker.ts" },
	}),
	trailingSlash: 'always',
	integrations: [sitemap()],
	markdown: {
		remarkPlugins: [remarkGfm, remarkMath],
		rehypePlugins: [rehypeKatex],
		shikiConfig: {
			theme: oneMonokaiShikiTheme,
		},
	},
});
