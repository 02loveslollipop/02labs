# Blog Authoring (apps/blog)

## Location

- Source of truth (edit here):
  - `blog/<post-folder>/index.md`
  - Put post images next to the markdown file in the same folder.
- Build sync (Astro expects content under `src/content`):
  - Synced to `apps/blog/src/content/blog/<slug>/index.md` on dev/build/check.

Notes:

- `<slug>` is derived from the folder name (lowercased, underscores/spaces to hyphens, `.md` suffix stripped).

## Frontmatter Schema

Validated by:

- `apps/blog/src/content/config.ts`

Required frontmatter:

```yaml
---
title: "..."
description: "..."
pubDate: 2026-02-22
tags: ["ctf", "writeup"]
---
```

Optional frontmatter:

```yaml
updatedDate: 2026-02-23
featuredImage: "1.jpg"
draft: true
```

`tags` are mandatory:

- Every post must have at least one tag.
- Tags are used for:
  - tag archive pages at `/tags/<slug>/`
  - linked tags on post pages
  - related-post discovery
  - `keywords` in post JSON-LD

`featuredImage` rules:

- Used by the blog home card thumbnail.
- Used for social link previews (`og:image` and `twitter:image`) on post pages.
- If omitted, the first image found in the markdown body is used as fallback.
- Accepted formats:
  - Relative path from post folder (recommended): `featuredImage: "1.jpg"`
  - Absolute site path: `featuredImage: "/posts/<slug>/1.jpg"`
  - External URL: `featuredImage: "https://..."`.

## Routes

- Blog home: `https://blog.02labs.me/`
- Post pages: `https://blog.02labs.me/posts/<slug>/`
- Tag pages: `https://blog.02labs.me/tags/<tag>/`
- RSS: `https://blog.02labs.me/rss.xml`
- JSON archive feed: `https://blog.02labs.me/posts.json`

## Images (Static)

The blog syncs image files into `public/` automatically:

- Source of truth:
  - `blog/<post-folder>/*.(png|jpg|jpeg|webp|gif|svg|avif)`
- Copied to:
  - `apps/blog/public/posts/<slug>/...`
- In markdown, you can use either:
  - relative links like `![Alt](1.jpg)` (recommended for portability)
  - absolute links like `/posts/<slug>/1.jpg`

This keeps builds fully static and guarantees the images resolve in production.

Implementation:

- `apps/blog/scripts/sync-root-blog.mjs` syncs `./blog` into `apps/blog/src/content/blog`.
- `apps/blog/scripts/sync-post-assets.mjs` copies images into `apps/blog/public/posts`.

## Draft Workflow

- Set `draft: true` to hide a post from:
  - blog home listing
  - tag archive pages
  - related-post recommendations
  - RSS feed
  - static routes generation
