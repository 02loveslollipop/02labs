import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getPostSlug, stripMarkdownInline } from "../lib/posts";

export async function GET(context: { site: URL }) {
	const entries = await getCollection("blog");
	const posts = entries
		.filter((p) => !p.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	return rss({
		title: "02Labs Blog",
		description: "Writeups, notes, and deep dives.",
		site: context.site,
		items: posts.map((post) => ({
			title: stripMarkdownInline(post.data.title),
			description: stripMarkdownInline(post.data.description),
			link: `/posts/${getPostSlug(post)}/`,
			pubDate: post.data.pubDate,
		})),
	});
}
