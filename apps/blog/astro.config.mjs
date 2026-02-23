// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.02labs.me',
	output: 'static',
	trailingSlash: 'always',
	markdown: {
		remarkPlugins: [remarkGfm, remarkMath],
		rehypePlugins: [rehypeKatex],
	},
	integrations: [sitemap()],
});
