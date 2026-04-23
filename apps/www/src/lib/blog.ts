export const BLOG_ROOT = "https://blog.02labs.me/";
export const BLOG_RSS = `${BLOG_ROOT}rss.xml`;
export const BLOG_POSTS_JSON = `${BLOG_ROOT}posts.json`;
const BLOG_ROOT_ALIASES = [
	"https://blog.02labs.me/",
	"https://blog.02loveslollipop.uk/",
];

export interface BlogPost {
	title: string;
	description: string;
	excerpt: string;
	link: string;
	pubDate: string;
	imageSrc: string | null;
	tags: string[];
}

export interface BlogArchivePost {
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

export interface FeaturedBlogPost {
	title: string;
	href: string;
	description: string;
}

export interface BlogTagLink {
	label: string;
	href: string;
	description: string;
}

export const featuredBlogPosts: FeaturedBlogPost[] = [
	{
		title: "Carry the Flame",
		href: `${BLOG_ROOT}posts/carry-the-flame/`,
		description:
			"GPU-focused crypto writeup on recovering a per-session SPN key under same-connection constraints.",
	},
	{
		title: "Eyes on the Sky 1 and 2",
		href: `${BLOG_ROOT}posts/eyes-on-the-sky-1-and-2/`,
		description:
			"OSINT reconstruction of a photographed aircraft using EXIF, ADS-B replay, and geometric back-projection.",
	},
	{
		title: "Bloom",
		href: `${BLOG_ROOT}posts/bloom/`,
		description:
			"Crypto writeup showing how excluding a single OTP key state collapses secrecy and enables plaintext recovery.",
	},
];

export const majorBlogTags: BlogTagLink[] = [
	{
		label: "CTF",
		href: `${BLOG_ROOT}tags/ctf/`,
		description: "Challenge writeups, solve paths, and practical attack notes.",
	},
	{
		label: "Crypto",
		href: `${BLOG_ROOT}tags/crypto/`,
		description: "Cryptography challenges, solver design, and attack analysis.",
	},
	{
		label: "OSINT",
		href: `${BLOG_ROOT}tags/osint/`,
		description:
			"Investigations, geolocation work, and source-correlation workflows.",
	},
	{
		label: "Writeup",
		href: `${BLOG_ROOT}tags/writeup/`,
		description:
			"Long-form technical breakdowns with results, reasoning, and tooling.",
	},
];

function decodeHtmlEntities(input: string): string {
	let output = String(input || "");
	for (let i = 0; i < 2; i++) {
		const next = output
			.replaceAll("&amp;", "&")
			.replaceAll("&apos;", "'")
			.replaceAll("&#39;", "'")
			.replaceAll("&quot;", '"')
			.replaceAll("&lt;", "<")
			.replaceAll("&gt;", ">");
		if (next === output) break;
		output = next;
	}
	return output;
}

function normalizeBlogUrl(url: string): string {
	const trimmed = String(url || "").trim();
	if (!trimmed) return "";
	for (const root of BLOG_ROOT_ALIASES) {
		if (trimmed.startsWith(root)) return trimmed.replace(root, BLOG_ROOT);
	}
	return trimmed;
}

function normalizeImageUrl(url: string | null | undefined): string | null {
	const trimmed = String(url || "").trim();
	if (!trimmed) return null;
	if (/^https?:\/\//i.test(trimmed)) return normalizeBlogUrl(trimmed);
	if (trimmed.startsWith("//")) return `https:${trimmed}`;
	if (trimmed.startsWith("/")) return new URL(trimmed, BLOG_ROOT).toString();
	return new URL(trimmed, BLOG_ROOT).toString();
}

function getString(record: Record<string, unknown>, key: string): string {
	const value = record[key];
	return typeof value === "string" ? value.trim() : "";
}

function getNumber(
	record: Record<string, unknown>,
	key: string,
): number | null {
	const value = record[key];
	const parsed =
		typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
	return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTags(tags: unknown): string[] {
	return Array.isArray(tags)
		? tags.map((tag) => String(tag || "").trim()).filter(Boolean)
		: [];
}

function parseDate(value: string): Date | null {
	const date = new Date(value);
	return Number.isNaN(date.valueOf()) ? null : date;
}

function formatDisplayDate(date: Date): string {
	return date
		.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "2-digit",
			timeZone: "UTC",
		})
		.toUpperCase();
}

function formatDateCode(date: Date): string {
	return date.toISOString().slice(2, 10).replaceAll("-", ".");
}

function formatReadTime(minutes: number): string {
	return `${String(Math.max(1, Math.ceil(minutes))).padStart(2, "0")} MIN`;
}

function getReadingMinutesFromText(text: string): number {
	const words = String(text || "")
		.trim()
		.split(/\s+/)
		.filter(Boolean).length;
	return Math.max(1, Math.ceil(words / 200));
}

function extractSlugFromUrl(url: string): string {
	try {
		const segments = new URL(url).pathname.split("/").filter(Boolean);
		const postsIndex = segments.indexOf("posts");
		if (postsIndex >= 0 && segments[postsIndex + 1])
			return segments[postsIndex + 1];
		return segments.at(-1) ?? "";
	} catch {
		return "";
	}
}

function normalizeBlogPost(input: Partial<BlogPost>): BlogPost | null {
	const title = String(input.title || "").trim();
	const link = normalizeBlogUrl(String(input.link || ""));
	if (!title || !link) return null;

	const description = String(input.description || "").trim();
	const excerpt = String(input.excerpt || description).trim();
	const pubDate = String(input.pubDate || "").trim();
	return {
		title,
		description,
		excerpt: excerpt || description,
		link,
		pubDate,
		imageSrc: normalizeImageUrl(input.imageSrc),
		tags: normalizeTags(input.tags),
	};
}

function normalizeBlogArchivePost(
	input: Record<string, unknown>,
): BlogArchivePost | null {
	const title = getString(input, "title");
	const rawUrl = getString(input, "url") || getString(input, "link");
	const url = normalizeBlogUrl(rawUrl);
	const slug = getString(input, "slug") || extractSlugFromUrl(url);
	if (!title || !url || !slug) return null;

	const description = getString(input, "description");
	const excerpt = getString(input, "excerpt") || description;
	const pubDateRaw = getString(input, "pubDate");
	const pubDate = parseDate(pubDateRaw);
	const tags = normalizeTags(input.tags);
	const readMinutes =
		getNumber(input, "readMinutes") ??
		getReadingMinutesFromText(`${description} ${excerpt}`);

	return {
		slug,
		title,
		description,
		excerpt,
		url,
		pubDate: pubDate ? pubDate.toISOString() : pubDateRaw,
		pubDateDisplay:
			getString(input, "pubDateDisplay") ||
			(pubDate ? formatDisplayDate(pubDate) : ""),
		pubDateCode:
			getString(input, "pubDateCode") ||
			(pubDate ? formatDateCode(pubDate) : ""),
		imageSrc: normalizeImageUrl(getString(input, "imageSrc")),
		tags,
		primaryTag: getString(input, "primaryTag") || tags[0] || null,
		readMinutes,
		readTimeLabel:
			getString(input, "readTimeLabel") || formatReadTime(readMinutes),
	};
}

function sortArchivePosts<T extends { pubDate: string }>(posts: T[]): T[] {
	return [...posts].sort((a, b) => {
		const aDate = parseDate(a.pubDate)?.valueOf() ?? 0;
		const bDate = parseDate(b.pubDate)?.valueOf() ?? 0;
		return bDate - aDate;
	});
}

function limitPosts<T>(posts: T[], limit?: number): T[] {
	return typeof limit === "number" ? posts.slice(0, limit) : posts;
}

export function parseRssItems(xml: string): BlogPost[] {
	const items: BlogPost[] = [];
	const itemRe = /<item>([\s\S]*?)<\/item>/g;
	let match: RegExpExecArray | null;
	while ((match = itemRe.exec(xml)) !== null) {
		const block = match[1];
		const title = decodeHtmlEntities(
			(
				block.match(
					/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/,
				)?.[1] ?? ""
			).trim(),
		);
		const description = decodeHtmlEntities(
			(
				block.match(
					/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/,
				)?.[1] ?? ""
			).trim(),
		);
		const parsed = normalizeBlogPost({
			title,
			description,
			excerpt: description,
			link: (block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "").trim(),
			pubDate: (
				block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? ""
			).trim(),
			imageSrc: null,
			tags: [],
		});
		if (parsed) items.push(parsed);
	}
	return items;
}

function parsePostsJson(raw: unknown): BlogPost[] {
	if (!raw || typeof raw !== "object") return [];
	const posts = (raw as { posts?: unknown }).posts;
	if (!Array.isArray(posts)) return [];

	return posts
		.map((post) => {
			const record =
				typeof post === "object" && post
					? (post as Record<string, unknown>)
					: {};
			return normalizeBlogPost({
				title: typeof record.title === "string" ? record.title : "",
				description:
					typeof record.description === "string" ? record.description : "",
				excerpt: typeof record.excerpt === "string" ? record.excerpt : "",
				link: typeof record.url === "string" ? record.url : "",
				pubDate: typeof record.pubDate === "string" ? record.pubDate : "",
				imageSrc: typeof record.imageSrc === "string" ? record.imageSrc : null,
				tags: normalizeTags(record.tags),
			});
		})
		.filter((post): post is BlogPost => post !== null);
}

function parseBlogArchiveJson(raw: unknown): BlogArchivePost[] {
	if (!raw || typeof raw !== "object") return [];
	const posts = (raw as { posts?: unknown }).posts;
	if (!Array.isArray(posts)) return [];

	return sortArchivePosts(
		posts
			.map((post) => {
				const record =
					typeof post === "object" && post
						? (post as Record<string, unknown>)
						: {};
				return normalizeBlogArchivePost(record);
			})
			.filter((post): post is BlogArchivePost => post !== null),
	);
}

function toArchivePost(post: BlogPost): BlogArchivePost | null {
	return normalizeBlogArchivePost({
		slug: extractSlugFromUrl(post.link),
		title: post.title,
		description: post.description,
		excerpt: post.excerpt,
		url: post.link,
		pubDate: post.pubDate,
		imageSrc: post.imageSrc,
		tags: post.tags,
	});
}

async function fetchPostsJson(): Promise<unknown | null> {
	try {
		const jsonRes = await fetch(BLOG_POSTS_JSON, {
			signal: AbortSignal.timeout(3000),
			headers: { Accept: "application/json" },
		});
		return jsonRes.ok ? jsonRes.json() : null;
	} catch {
		return null;
	}
}

async function fetchRssArchivePosts(): Promise<BlogPost[]> {
	try {
		const rssRes = await fetch(BLOG_RSS, {
			signal: AbortSignal.timeout(3000),
			headers: { Accept: "application/rss+xml, application/xml, text/xml" },
		});
		if (!rssRes.ok) return [];
		const xml = await rssRes.text();
		return parseRssItems(xml);
	} catch {
		return [];
	}
}

export async function fetchBlogArchivePosts(
	limit?: number,
): Promise<BlogPost[]> {
	const postsJson = await fetchPostsJson();
	if (postsJson) {
		const parsed = parsePostsJson(postsJson);
		if (parsed.length > 0) return limitPosts(parsed, limit);
	}

	return limitPosts(await fetchRssArchivePosts(), limit);
}

export async function fetchBlogMirrorPosts(
	limit?: number,
): Promise<BlogArchivePost[]> {
	const postsJson = await fetchPostsJson();
	if (postsJson) {
		const parsed = parseBlogArchiveJson(postsJson);
		if (parsed.length > 0) return limitPosts(parsed, limit);
	}

	return limitPosts(
		sortArchivePosts(
			(await fetchRssArchivePosts())
				.map(toArchivePost)
				.filter((post): post is BlogArchivePost => post !== null),
		),
		limit,
	);
}

export async function fetchLatestBlogPosts(limit = 4): Promise<BlogPost[]> {
	return fetchBlogArchivePosts(limit);
}
