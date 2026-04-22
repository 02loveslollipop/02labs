import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import {
	BLOG_DESCRIPTION,
	BLOG_NAME,
	getPostExcerpt,
	getPostSlug,
	sortBlogEntries,
	stripMarkdownInline,
} from "../lib/posts";

export async function GET(context: { site: URL }) {
	const posts = sortBlogEntries((await getCollection("blog")).filter((p) => !p.data.draft));

	return rss({
		title: BLOG_NAME,
		description: BLOG_DESCRIPTION,
		site: context.site,
		customData: `<language>en</language><generator>Astro</generator>`,
		items: posts.map((post) => ({
			title: stripMarkdownInline(post.data.title),
			description: stripMarkdownInline(post.data.description),
			link: `/posts/${getPostSlug(post)}/`,
			pubDate: post.data.pubDate,
			categories: post.data.tags,
			content: getPostExcerpt(post.body, stripMarkdownInline(post.data.description)),
		})),
	});
}
