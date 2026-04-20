# Blog Authoring (apps/blog)

## Source of Truth

- Edit posts in:
  - `blog/<post-folder>/index.md`
- Put post images next to the markdown file in the same folder.
- Build sync copies content into:
  - `apps/blog/src/content/blog/<slug>/index.md`

`<slug>` is derived from the folder name:

- lowercased
- underscores and spaces become hyphens
- trailing `.md` suffix is removed

## Frontmatter Schema

Validated by:

- `apps/blog/src/content/config.ts`

Required:

```yaml
---
title: "..."
description: "..."
pubDate: 2026-02-22
tags: ["ctf", "writeup"]
---
```

Optional:

```yaml
---
updatedDate: 2026-02-23
featuredImage: "1.jpg"
draft: true
---
```

## How Content Maps to the Redesigned UI

### Archive Home / Tag Archives

- `title`
  - archive row title
  - featured-card title
- `description`
  - used for metadata and fallback summary
- first substantial paragraph in body
  - used for archive excerpt when available
- `pubDate`
  - shown in archive metadata
- markdown word count
  - converted to read time in the archive and post hero
- `tags`
  - first tag becomes the primary category treatment
  - all tags contribute to the tag-chip archive bar and tag archive routing
- image selection:
  - archive preview uses `featuredImage` first
  - if `featuredImage` is missing, the first markdown image becomes the archive/social fallback

### Post Pages

- `title`
  - main display title
  - SEO title
- `description`
  - lede paragraph
  - SEO description
- `featuredImage`
  - controls the hero figure at the top of the article
  - if absent, the hero figure is omitted entirely
- first markdown image
  - may still be used for social/archive fallback when `featuredImage` is absent
- `tags`
  - render as hero pills
  - render in the metadata hashtag row
  - drive related-post matching and JSON-LD keywords
- `h2` headings
  - define the table of contents
  - drive the numbered section layout

## Heading Guidance

- Use `##` for major article sections.
- Those `h2` sections are what populate the TOC in the redesigned post layout.
- Use `###` only inside a major section; it does not create a TOC entry.

## Images and Figures

Static image sync:

- Source:
  - `blog/<post-folder>/*.(png|jpg|jpeg|webp|gif|svg|avif)`
- Copied to:
  - `apps/blog/public/posts/<slug>/...`

Markdown image usage:

- Recommended:
  - `![Alt text](1.jpg)`
- Also valid:
  - `![Alt text](/posts/<slug>/1.jpg)`

Design-related notes:

- `featuredImage` is for the article hero figure.
- Other inline markdown images render inside the prose flow.
- Alt text matters because it is the only author-controlled figure description available to the layout.
- No separate caption field exists today; if you need descriptive figure context, put it in the surrounding prose or alt text.

## Routes

- Blog home: `https://blog.02labs.me/`
- Post pages: `https://blog.02labs.me/posts/<slug>/`
- Tag pages: `https://blog.02labs.me/tags/<tag>/`
- RSS: `https://blog.02labs.me/rss.xml`
- JSON archive feed: `https://blog.02labs.me/posts.json`

## Draft Workflow

- `draft: true` hides a post from:
  - blog home
  - tag archives
  - related-post recommendations
  - RSS
  - `posts.json`
  - static route generation

## Build Sync Scripts

- `apps/blog/scripts/sync-root-blog.mjs`
  - syncs `./blog` into `apps/blog/src/content/blog`
- `apps/blog/scripts/sync-post-assets.mjs`
  - copies post assets into `apps/blog/public/posts`
