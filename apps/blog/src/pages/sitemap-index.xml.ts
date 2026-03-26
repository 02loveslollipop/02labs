import { getCollection } from "astro:content";
import { sortBlogEntries } from "../lib/posts";

function xmlEscape(input: string): string {
	return String(input)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

export async function GET(context: { site: URL }) {
	const posts = sortBlogEntries((await getCollection("blog")).filter((entry) => !entry.data.draft));
	const newestPostDate = posts[0] ? (posts[0].data.updatedDate ?? posts[0].data.pubDate).toISOString() : new Date().toISOString();
	const sitemapUrl = new URL("/sitemap-0.xml", context.site).toString();
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>${xmlEscape(sitemapUrl)}</loc>\n    <lastmod>${xmlEscape(newestPostDate)}</lastmod>\n  </sitemap>\n</sitemapindex>\n`;

	return new Response(body, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
		},
	});
}
