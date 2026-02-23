# Blog Authoring (apps/blog)

## Location

- Posts live in `apps/blog/src/content/blog/`.
- Folder-per-post layout:
  - `apps/blog/src/content/blog/<slug>/index.md`
  - Put post images next to the markdown file in the same folder.

## Frontmatter Schema

Validated by:

- `apps/blog/src/content/config.ts`

Required frontmatter:

```yaml
---
title: "..."
description: "..."
pubDate: 2026-02-22
---
```

Optional frontmatter:

```yaml
updatedDate: 2026-02-23
tags: ["osint", "writeup"]
draft: true
```

## Routes

- Blog home: `https://blog.02labs.me/`
- Post pages: `https://blog.02labs.me/posts/<slug>/`
- RSS: `https://blog.02labs.me/rss.xml`

## Images (Static)

The blog syncs image files from the content folders into `public/` automatically:

- Source of truth:
  - `apps/blog/src/content/blog/<slug>/*.(png|jpg|jpeg|webp|gif|svg|avif)`
- Copied to:
  - `apps/blog/public/posts/<slug>/...`
- In markdown, you can use either:
  - relative links like `![Alt](1.jpg)` (recommended for portability)
  - absolute links like `/posts/<slug>/1.jpg`

This keeps builds fully static and guarantees the images resolve in production.

Implementation:

- `apps/blog/scripts/sync-post-assets.mjs` runs on `npm -w apps/blog run dev` and `npm -w apps/blog run build`.

## Draft Workflow

- Set `draft: true` to hide a post from:
  - blog home listing
  - RSS feed
  - static routes generation
