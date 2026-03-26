import { getCollection } from "astro:content";
import { getPostSlug, slugifyTag, sortBlogEntries } from "../lib/posts";

interface SitemapEntry {
	url: string;
	lastmod: string;
}

function xmlEscape(input: string): string {
	return String(input)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

function toLastmod(date: Date): string {
	return date.toISOString();
}

export async function GET(context: { site: URL }) {
	const posts = sortBlogEntries((await getCollection("blog")).filter((entry) => !entry.data.draft));
	const newestPostDate = posts[0] ? (posts[0].data.updatedDate ?? posts[0].data.pubDate) : new Date();
	const tagLatest = new Map<string, { label: string; lastmod: Date }>();

	for (const post of posts) {
		const postDate = post.data.updatedDate ?? post.data.pubDate;
		for (const tag of post.data.tags) {
			const slug = slugifyTag(tag);
			if (!slug) continue;
			const current = tagLatest.get(slug);
			if (!current || postDate > current.lastmod) {
				tagLatest.set(slug, { label: tag, lastmod: postDate });
			}
		}
	}

	const entries: SitemapEntry[] = [
		{
			url: new URL("/", context.site).toString(),
			lastmod: toLastmod(newestPostDate),
		},
		...posts.map((post) => ({
			url: new URL(`/posts/${getPostSlug(post)}/`, context.site).toString(),
			lastmod: toLastmod(post.data.updatedDate ?? post.data.pubDate),
		})),
		...Array.from(tagLatest.entries())
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([slug, value]) => ({
				url: new URL(`/tags/${slug}/`, context.site).toString(),
				lastmod: toLastmod(value.lastmod),
			})),
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
		.map(
			(entry) =>
				`  <url>\n    <loc>${xmlEscape(entry.url)}</loc>\n    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>\n  </url>`
		)
		.join("\n")}\n</urlset>\n`;

	return new Response(body, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
		},
	});
}
