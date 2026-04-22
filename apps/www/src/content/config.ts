import { defineCollection, z } from "astro:content";

const projects = defineCollection({
	type: "data",
	schema: z.object({
		slug: z.string().min(1),
		title: z.string().min(1),
		summary: z.string().min(1),
		description: z.string().min(1),
		image: z
			.object({
				src: z.string().min(1),
				alt: z.string().min(1),
			})
			.optional(),
		featured: z.boolean(),
		order: z.number().int(),
		stack: z.array(z.string().min(1)),
		highlights: z.array(z.string().min(1)).optional(),
		links: z.object({
			repo: z.string().url(),
			live: z.string().url().optional(),
			detailsLabel: z.string().min(1).optional(),
			cta: z
				.object({
					href: z.string().url(),
					label: z.string().min(1),
				})
				.optional(),
		}),
		card: z
			.object({
				badge: z.string().min(1).optional(),
				layout: z.enum(["minimal", "dense"]).optional(),
			})
			.optional(),
	}),
});

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

export const collections = { projects, blog };
