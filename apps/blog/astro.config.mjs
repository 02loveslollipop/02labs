// @ts-check
import { defineConfig } from 'astro/config';
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
	site: 'https://blog.02labs.me',
	output: 'static',
	adapter: cloudflare({
		imageService: "compile",
		workerEntryPoint: { path: "./src/worker.ts" },
	}),
	trailingSlash: 'always',
	markdown: {
		remarkPlugins: [remarkGfm, remarkMath],
		rehypePlugins: [rehypeKatex],
		shikiConfig: {
			theme: oneMonokaiShikiTheme,
		},
	},
});
