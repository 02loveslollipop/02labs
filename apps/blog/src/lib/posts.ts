import type { CollectionEntry } from "astro:content";

export const BLOG_NAME = "02Labs Blog";
export const BLOG_DESCRIPTION =
	"CTF writeups, OSINT notes, crypto solves, and systems engineering deep dives.";
export const BLOG_LOCALE = "en";
export const BLOG_TWITTER_HANDLE = "@02loveslollipop";
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

export interface BlogIndexPost {
	slug: string;
	title: string;
	description: string;
	excerpt: string;
	url: string;
	pubDate: string;
	pubDateDisplay: string;
	pubDateCode: string;
	imageSrc: string | null;
	tags: string[];
	primaryTag: string | null;
	readMinutes: number;
	readTimeLabel: string;
}

export interface RelatedPostPreview {
	slug: string;
	title: string;
	excerpt: string;
	pubDate: Date;
}

export interface BlogTagSummary {
	slug: string;
	label: string;
	count: number;
}

export interface TocHeading {
	depth: number;
	id: string;
	text: string;
}

const DOCUMENT_TYPE_TAG_SLUGS = new Set([
	"writeup",
	"post",
	"deep-dive",
	"deep-dive",
	"deep",
	"dive",
	"essay",
	"analysis",
	"note",
	"notes",
]);


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

function getDisplayTagPriority(input: string): number {
	const slug = slugifyTag(input);
	if (!slug) return 99;
	if (slug === "ctf") return 0;
	if (DOCUMENT_TYPE_TAG_SLUGS.has(slug)) return 2;
	return 1;
}

export function orderDisplayTags(tags: string[]): string[] {
	return [...tags].sort((a, b) => {
		const priorityDiff = getDisplayTagPriority(a) - getDisplayTagPriority(b);
		if (priorityDiff !== 0) return priorityDiff;
		return 0;
	});
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

export function countMarkdownWords(markdown: string): number {
	const cleaned = String(markdown || "")
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/`[^`]+`/g, " ")
		.replace(/!\[[^\]]*]\([^)]+\)/g, " ")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/[#>*_~|[\]()]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (!cleaned) return 0;
	return cleaned.split(" ").filter(Boolean).length;
}

export function formatDateIso(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(date: Date): string {
	return date
		.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "2-digit",
			timeZone: "UTC",
		})
		.toUpperCase();
}

export function formatDateCode(date: Date): string {
	return date.toISOString().slice(2, 10).replaceAll("-", ".");
}

export function getReadingMinutes(input: string | number): number {
	const words = typeof input === "number" ? input : countMarkdownWords(input);
	return Math.max(1, Math.ceil(words / 200));
}

export function formatReadTime(minutes: number): string {
	return `${String(minutes).padStart(2, "0")} MIN`;
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

export function getTagSummaries(entries: CollectionEntry<"blog">[]): BlogTagSummary[] {
	const tagMap = new Map<string, BlogTagSummary>();

	for (const entry of entries) {
		for (const tag of entry.data.tags ?? []) {
			const slug = slugifyTag(tag);
			if (!slug) continue;
			const existing = tagMap.get(slug);
			if (existing) {
				existing.count += 1;
				continue;
			}
			tagMap.set(slug, {
				slug,
				label: tag,
				count: 1,
			});
		}
	}

	return Array.from(tagMap.values()).sort((a, b) => {
		if (b.count !== a.count) return b.count - a.count;
		return a.label.localeCompare(b.label);
	});
}

export function slugifyHeading(input: string): string {
	return stripMarkdownInline(String(input || ""))
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

export function extractTocHeadings(markdownBody: string, depths = [1, 2, 3]): TocHeading[] {
	const allowedDepths = new Set(depths);
	const seenIds = new Map<string, number>();
	const headings: TocHeading[] = [];
	let inFence = false;

	for (const rawLine of String(markdownBody || "").split(/\r?\n/)) {
		const line = rawLine.trim();
		if (line.startsWith("```") || line.startsWith("~~~")) {
			inFence = !inFence;
			continue;
		}
		if (inFence) continue;

		const match = /^(#{1,6})\s+(.+?)\s*#*$/.exec(line);
		if (!match) continue;

		const depth = match[1].length;
		if (!allowedDepths.has(depth)) continue;

		const text = stripMarkdownInline(match[2]);
		if (!text) continue;

		const baseId = slugifyHeading(text) || "section";
		const count = seenIds.get(baseId) ?? 0;
		seenIds.set(baseId, count + 1);
		headings.push({
			depth,
			id: count === 0 ? baseId : `${baseId}-${count + 1}`,
			text,
		});
	}

	return headings;
}

export function toBlogIndexPost(
	entry: CollectionEntry<"blog">,
	site?: URL
): BlogIndexPost {
	const slug = getPostSlug(entry);
	const orderedTags = orderDisplayTags(entry.data.tags);
	const imageSrc =
		resolvePostImageSrc(entry.data.featuredImage, slug) ??
		getPostFirstImageSrc(entry.body, slug);
	const wordCount = countMarkdownWords(entry.body);
	const readMinutes = getReadingMinutes(wordCount);
	return {
		slug,
		title: stripMarkdownInline(entry.data.title),
		description: stripMarkdownInline(entry.data.description),
		excerpt: getPostExcerpt(entry.body, stripMarkdownInline(entry.data.description)),
		url: resolveSiteUrl(`/posts/${slug}/`, site),
		pubDate: entry.data.pubDate.toISOString(),
		pubDateDisplay: formatDisplayDate(entry.data.pubDate),
		pubDateCode: formatDateCode(entry.data.pubDate),
		imageSrc: imageSrc ? resolveSiteUrl(imageSrc, site) : null,
		tags: orderedTags,
		primaryTag: orderedTags[0] ?? null,
		readMinutes,
		readTimeLabel: formatReadTime(readMinutes),
	};
}
