# 02Labs Design Rules

## Core Principles

- The blog now uses a dark, contour-first system rather than light paper cards.
- Visual structure comes from typography, spacing, and hairline borders before color.
- The only UI accent is cobalt `#2d6cff`, used for active states, hover states, and emphasis.
- The animated background wash remains the only atmospheric color field behind the UI.
- Archive and post pages share one visual language; tags are not a separate visual mode.

## Typography

- Display: `Archivo Black`
  - Used for archive heroes, featured titles, post titles, and section headings.
- Prose: `Outfit`
  - Used for descriptions, article text, excerpts, and long-form reading.
- Structure/meta: `JetBrains Mono`
  - Used for nav items, tag pills, dates, read time, TOC labels, code labels, and archive rows.

## Tokens

Blog tokens live in `apps/blog/src/styles/global.css`.

- Surfaces:
  - `--bg`: main page background
  - `--bg-ink`: deepest background / image placeholder field
  - `--bg-elevated`: elevated dark surface token
- Foreground:
  - `--fg`
  - `--fg-mute`
  - `--fg-dim`
  - `--fg-faint`
- Lines:
  - `--line`
  - `--line-strong`
  - `--line-accent`
- Accent:
  - `--accent`
  - `--accent-soft`
  - `--accent-wash`

## Shared Components

### Site Header

- Component: `apps/blog/src/components/SiteHeader.astro`
- Pattern:
  - sticky
  - blurred
  - thin bottom border
  - `02Labs` brand at left
  - main-site navigation in the center
  - GitHub action on the right

### Background

- Component: `apps/blog/src/components/Background.astro`
- Behavior:
  - fixed full-screen background
  - radial cobalt/navy wash
  - subtle drift animation
  - dark overlay to preserve legibility

## Archive System

Archive pages include:

- a hero section with mono eyebrow and display headline
- a tag-chip bar with crawlable links to tag archives
- one featured post block
- a linear archive list for remaining posts
- a mono footer with archive count and RSS or archive navigation

Implementation:

- Blog home: `apps/blog/src/pages/index.astro`
- Tag archives: `apps/blog/src/pages/tags/[tag].astro`

Rules:

- First post in sorted order is the featured post.
- Tag chips are links, not client-side toggles.
- Archive rows stay text-forward and do not become card grids.
- Read time is shown in archive metadata using shared helpers from `apps/blog/src/lib/posts.ts`.

## Article System

Post pages include:

- tag eyebrow pills
- large display title
- lede paragraph
- mono metadata bar with date, optional updated date, read time, and tag links
- optional hero figure only when `featuredImage` exists
- two-column body with TOC and prose
- end-of-article navigation cards

Implementation:

- Layout: `apps/blog/src/layouts/PostLayout.astro`
- Entry page: `apps/blog/src/pages/posts/[...slug].astro`

Rules:

- Do not render a hero placeholder when a post lacks `featuredImage`.
- TOC is derived from `h2` headings.
- `h2` sections are numbered visually via CSS counters.
- Code blocks get a mono language label bar.
- Figures and captions use bordered, document-like framing.
- Blockquotes use accent-border emphasis, not filled callout cards.

## Authoring Constraints That Affect Design

- `featuredImage` controls the article hero figure.
- First body image remains a fallback for archive/social previews when `featuredImage` is absent.
- `description` feeds the lede and SEO description.
- `tags` drive pills, archive categories, tag archives, and JSON-LD keywords.
- `h2` headings define the article TOC structure.
- Image alt text matters because it is the only reliable author-supplied figure description.

## Interaction Rules

- Hover/focus can shift text and borders to `--accent`.
- Do not introduce additional accent colors for categories or tags.
- Prefer translation and underline/border shifts over large motion.
- Respect `prefers-reduced-motion` by disabling smooth scrolling and background drift.
