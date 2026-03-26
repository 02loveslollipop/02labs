export const BLOG_ROOT = "https://blog.02loveslollipop.uk/";
export const BLOG_RSS = `${BLOG_ROOT}rss.xml`;
const LEGACY_BLOG_ROOT = "https://blog.02labs.me/";

export interface BlogPost {
	title: string;
	description: string;
	link: string;
	pubDate: string;
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

export function parseRssItems(xml: string): BlogPost[] {
	const items: BlogPost[] = [];
	const itemRe = /<item>([\s\S]*?)<\/item>/g;
	let match: RegExpExecArray | null;
	while ((match = itemRe.exec(xml)) !== null) {
		const block = match[1];
		const title = decodeHtmlEntities(
			(block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] ?? "").trim()
		);
		const desc = decodeHtmlEntities(
			(block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] ?? "").trim()
		);
		const link = (block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "").trim();
		const date = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "").trim();
		if (title && link) {
			items.push({
				title,
				description: desc,
				link: link.startsWith(LEGACY_BLOG_ROOT) ? link.replace(LEGACY_BLOG_ROOT, BLOG_ROOT) : link,
				pubDate: date,
			});
		}
	}
	return items;
}

export async function fetchLatestBlogPosts(limit = 4): Promise<BlogPost[]> {
	try {
		const rssRes = await fetch(BLOG_RSS, {
			signal: AbortSignal.timeout(3000),
			headers: { Accept: "application/rss+xml, application/xml, text/xml" },
		});
		if (!rssRes.ok) return [];
		const xml = await rssRes.text();
		return parseRssItems(xml).slice(0, limit);
	} catch {
		return [];
	}
}
