import type { CollectionEntry } from "astro:content";

export const BLOG_NAME = "02Labs Blog";
export const BLOG_DESCRIPTION =
	"CTF writeups, OSINT notes, crypto solves, and systems engineering deep dives.";
export const BLOG_AUTHOR = {
	name: "02loveslollipop",
	url: "https://02labs.me/",
	sameAs: ["https://github.com/02loveslollipop"],
} as const;
export const BLOG_PUBLISHER = {
	name: "02Labs",
	url: "https://02labs.me/",
	logoPath: "/02loveslollipop.png",
} as const;

export interface RelatedPostPreview {
	slug: string;
	title: string;
	excerpt: string;
	pubDate: Date;
}

export function getPostSlug(entry: CollectionEntry<"blog">): string {
	// Normalize "folder posts" like `my-post/index.md` to slug `my-post`.
	const id = entry.id.replaceAll("\\", "/");
	let slug = id.replace(/\.mdx?$/i, "");
	slug = slug.replace(/\/index$/i, "");
	return slug || entry.slug;
}

export function resolveSiteUrl(pathname: string, site?: URL): string {
	return site ? new URL(pathname, site).toString() : pathname;
}

export function sortBlogEntries(entries: CollectionEntry<"blog">[]): CollectionEntry<"blog">[] {
	return [...entries].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function slugifyTag(input: string): string {
	return String(input || "")
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, " ")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function truncate(text: string, max = 190): string {
	const cleaned = text.trim();
	if (cleaned.length <= max) return cleaned;
	return `${cleaned.slice(0, max).trimEnd()}...`;
}

function escapeHtml(input: string): string {
	return String(input || "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function stripMarkdownInline(line: string): string {
	return line
		.replace(/!\[[^\]]*]\([^)]+\)/g, " ")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/`([^`]+)`/g, "$1")
		.replace(/[*_~]+/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

export function renderInlineMarkdown(input: string): string {
	const safe = escapeHtml(String(input || "").trim());
	return safe
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/\*([^*]+)\*/g, "<em>$1</em>")
		.replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function getPostExcerpt(markdownBody: string, fallback: string): string {
	const lines = String(markdownBody || "").split(/\r?\n/);
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) continue;
		if (
			line.startsWith("#") ||
			line.startsWith("```") ||
			line.startsWith(">") ||
			line.startsWith("- ") ||
			line.startsWith("* ") ||
			line.startsWith("|")
		) {
			continue;
		}
		const cleaned = stripMarkdownInline(line);
		if (cleaned.length >= 24) return truncate(cleaned);
	}
	return truncate(fallback);
}

export function resolvePostImageSrc(imagePath: string | null | undefined, slug: string): string | null {
	const raw = String(imagePath ?? "")
		.replace(/^<|>$/g, "")
		.trim();
	if (!raw) return null;
	if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("//")) return raw;
	if (raw.startsWith("/")) return raw;

	const normalized = raw.replace(/^\.\//, "");
	return `/posts/${slug}/${normalized}`;
}

export function getPostFirstImageSrc(markdownBody: string, slug: string): string | null {
	const match = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/.exec(String(markdownBody || ""));
	return resolvePostImageSrc(match?.[1], slug);
}

export function getRelatedPosts(
	currentEntry: CollectionEntry<"blog">,
	entries: CollectionEntry<"blog">[],
	limit = 3
): RelatedPostPreview[] {
	const currentSlug = getPostSlug(currentEntry);
	const currentTags = new Set((currentEntry.data.tags ?? []).map(slugifyTag));
	const candidates = sortBlogEntries(
		entries.filter((entry) => !entry.data.draft && getPostSlug(entry) !== currentSlug)
	);

	const scored = candidates.map((entry) => {
		const sharedCount = (entry.data.tags ?? []).reduce((count, tag) => {
			return count + (currentTags.has(slugifyTag(tag)) ? 1 : 0);
		}, 0);
		return { entry, sharedCount };
	});

	const withSharedTags = scored
		.filter((candidate) => candidate.sharedCount > 0)
		.sort((a, b) => {
			if (b.sharedCount !== a.sharedCount) return b.sharedCount - a.sharedCount;
			return b.entry.data.pubDate.valueOf() - a.entry.data.pubDate.valueOf();
		});

	const source = withSharedTags.length > 0 ? withSharedTags : scored;

	return source.slice(0, limit).map(({ entry }) => ({
		slug: getPostSlug(entry),
		title: stripMarkdownInline(entry.data.title),
		excerpt: getPostExcerpt(entry.body, stripMarkdownInline(entry.data.description)),
		pubDate: entry.data.pubDate,
	}));
}
