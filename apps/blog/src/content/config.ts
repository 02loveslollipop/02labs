import { defineCollection, z } from "astro:content";

const blog = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string().min(1),
		description: z.string().min(1),
		pubDate: z.date(),
		updatedDate: z.date().optional(),
		tags: z.array(z.string().min(1)).min(1),
		featuredImage: z.string().min(1).optional(),
		draft: z.boolean().optional(),
	}),
});

export const collections = { blog };
