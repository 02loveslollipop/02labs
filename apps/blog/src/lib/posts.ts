import type { CollectionEntry } from "astro:content";

export function getPostSlug(entry: CollectionEntry<"blog">): string {
	// Normalize "folder posts" like `my-post/index.md` to slug `my-post`.
	const id = entry.id.replaceAll("\\", "/");
	let slug = id.replace(/\.mdx?$/i, "");
	slug = slug.replace(/\/index$/i, "");
	return slug || entry.slug;
}

