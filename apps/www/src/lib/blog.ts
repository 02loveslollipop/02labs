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
		description: "Investigations, geolocation work, and source-correlation workflows.",
	},
	{
		label: "Writeup",
		href: `${BLOG_ROOT}tags/writeup/`,
		description: "Long-form technical breakdowns with results, reasoning, and tooling.",
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
		tags: Array.isArray(input.tags)
			? input.tags.map((tag) => String(tag || "").trim()).filter(Boolean)
			: [],
	};
}

export function parseRssItems(xml: string): BlogPost[] {
	const items: BlogPost[] = [];
	const itemRe = /<item>([\s\S]*?)<\/item>/g;
	let match: RegExpExecArray | null;
	while ((match = itemRe.exec(xml)) !== null) {
		const block = match[1];
		const title = decodeHtmlEntities(
			(block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] ?? "").trim()
		);
		const description = decodeHtmlEntities(
			(block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] ?? "").trim()
		);
		const parsed = normalizeBlogPost({
			title,
			description,
			excerpt: description,
			link: (block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "").trim(),
			pubDate: (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "").trim(),
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
			const record = typeof post === "object" && post ? (post as Record<string, unknown>) : {};
			return normalizeBlogPost({
				title: typeof record.title === "string" ? record.title : "",
				description: typeof record.description === "string" ? record.description : "",
				excerpt: typeof record.excerpt === "string" ? record.excerpt : "",
				link: typeof record.url === "string" ? record.url : "",
				pubDate: typeof record.pubDate === "string" ? record.pubDate : "",
				imageSrc: typeof record.imageSrc === "string" ? record.imageSrc : null,
				tags: Array.isArray(record.tags)
					? record.tags.filter((tag): tag is string => typeof tag === "string")
					: [],
			});
		})
		.filter((post): post is BlogPost => post !== null);
}

export async function fetchBlogArchivePosts(limit?: number): Promise<BlogPost[]> {
	try {
		const jsonRes = await fetch(BLOG_POSTS_JSON, {
			signal: AbortSignal.timeout(3000),
			headers: { Accept: "application/json" },
		});
		if (jsonRes.ok) {
			const parsed = parsePostsJson(await jsonRes.json());
			return typeof limit === "number" ? parsed.slice(0, limit) : parsed;
		}
	} catch {
		// Fall through to RSS parsing below.
	}

	try {
		const rssRes = await fetch(BLOG_RSS, {
			signal: AbortSignal.timeout(3000),
			headers: { Accept: "application/rss+xml, application/xml, text/xml" },
		});
		if (!rssRes.ok) return [];
		const xml = await rssRes.text();
		const parsed = parseRssItems(xml);
		return typeof limit === "number" ? parsed.slice(0, limit) : parsed;
	} catch {
		return [];
	}
}

export async function fetchLatestBlogPosts(limit = 4): Promise<BlogPost[]> {
	return fetchBlogArchivePosts(limit);
}
