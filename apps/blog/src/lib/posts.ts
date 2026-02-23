import type { CollectionEntry } from "astro:content";

export function getPostSlug(entry: CollectionEntry<"blog">): string {
	// Normalize "folder posts" like `my-post/index.md` to slug `my-post`.
	const id = entry.id.replaceAll("\\", "/");
	let slug = id.replace(/\.mdx?$/i, "");
	slug = slug.replace(/\/index$/i, "");
	return slug || entry.slug;
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

export function getPostFirstImageSrc(markdownBody: string, slug: string): string | null {
	const match = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/.exec(String(markdownBody || ""));
	if (!match?.[1]) return null;

	const raw = match[1].replace(/^<|>$/g, "").trim();
	if (!raw) return null;
	if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("//")) return raw;
	if (raw.startsWith("/")) return raw;

	const normalized = raw.replace(/^\.\//, "");
	return `/posts/${slug}/${normalized}`;
}
