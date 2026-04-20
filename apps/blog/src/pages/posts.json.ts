import { getCollection } from "astro:content";
import {
	sortBlogEntries,
	toBlogIndexPost,
} from "../lib/posts";

export async function GET(context: { site: URL }) {
	const posts = sortBlogEntries((await getCollection("blog")).filter((entry) => !entry.data.draft))
		.map((entry) => toBlogIndexPost(entry, context.site));

	return new Response(JSON.stringify({ posts }), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=900",
		},
	});
}
