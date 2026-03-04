// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	site: 'https://02labs.me',
	output: 'static',
	adapter: cloudflare({ platformProxy: { enabled: true }, imageService: "compile" }),
	trailingSlash: 'always',
	integrations: [sitemap()],
});
