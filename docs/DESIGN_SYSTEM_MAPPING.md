# 02Labs Design System: Component Catalog & Migration Mapping

This document provides a comprehensive mapping of all components and elements across **02labs WWW** (`apps/www`) and **02labs Blog** (`apps/blog`) to two major enterprise design systems:
1. **GitHub Primer Design System** (`@primer/css` / `@primer/react` / Primer ViewComponents)
2. **AWS Cloudscape Design System** (`@cloudscape-design/components` / `@cloudscape-design/global-styles`)

It also documents the **Design System Token Architecture** and the decoupled component layer implemented in the codebase to make migrating or re-theming painless without requiring large refactoring.

---

## 1. Architecture & Design Principles

### 1.1 Core Principles
- **Element Order & Interaction Preservation:** The exact order of sections and elements is preserved, especially the **Hero Section** of the WWW, its interactive pointer-reactive wave field canvas, WAAPI entrance stagger animations, and the card-stack controller (`[data-snap-section]`).
- **Semantic Token Abstraction (`--ds-*`):** All components and global stylesheets consume unified `--ds-*` design tokens. These tokens bridge existing styling while exposing automatic adapters for both GitHub Primer (`[data-design-system="primer"]`) and AWS Cloudscape (`[data-design-system="cloudscape"]`).
- **Atomic Decoupling:** Primitives (`Badge`, `Button`, `Card`, `SectionHeader`, `DataTable`, `Breadcrumb`) are encapsulated in `src/components/ds/`. Domain sections (`IntroSection`, `Ch0wn3rsSection`, `BlogSection`, `FeaturedProjectsSection`, `Footer`) live in `src/components/sections/`.
- **Zero-Refactor Page Templates:** Page templates (`apps/www/src/pages/index.astro`, `apps/www/src/pages/projects/[slug].astro`, `apps/www/src/pages/projects/index.astro`, `apps/blog/src/pages/index.astro`) declare high-level semantic components with explicit props rather than embedded raw HTML.

---

## 2. Design Token Mapping Matrix

The canonical token layer resides in `apps/www/src/styles/design-system.css` and `apps/blog/src/styles/design-system.css`.

| Token Role | 02Labs Token (`--ds-*`) | Existing Legacy Token | GitHub Primer Token | AWS Cloudscape Token | Default 02Labs Dark Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Canvas Background** | `--ds-surface-canvas` | `--bg` | `--color-canvas-default` | `--color-background-layout-main` | `#0b0b10` |
| **Deep Inset Surface** | `--ds-surface-ink` | `--bg-ink` | `--color-canvas-inset` | `--color-background-container-content` | `#07070b` |
| **Elevated Surface** | `--ds-surface-elevated` | `--bg-elevated` | `--color-canvas-subtle` | `--color-background-container-header` | `#101016` |
| **Overlay / Modal** | `--ds-surface-overlay` | (rgba overlay) | `--color-canvas-overlay` | `--color-background-dropdown-item-hover` | `rgba(16, 16, 22, 0.76)` |
| **Wash Accent Surface** | `--ds-surface-wash` | `--accent-wash` | `--color-accent-subtle` | `--color-background-item-selected` | `rgba(45, 108, 255, 0.06)` |
| **Text: Primary** | `--ds-text-primary` | `--fg` | `--color-fg-default` | `--color-text-body-default` | `rgba(255, 255, 255, 0.92)` |
| **Text: Secondary / Muted** | `--ds-text-muted` | `--fg-mute` | `--color-fg-muted` | `--color-text-body-secondary` | `rgba(255, 255, 255, 0.62)` |
| **Text: Dim** | `--ds-text-dim` | `--fg-dim` | `--color-fg-subtle` | `--color-text-label` | `rgba(255, 255, 255, 0.42)` |
| **Text: Faint** | `--ds-text-faint` | `--fg-faint` | `--color-fg-on-emphasis` | `--color-text-disabled` | `rgba(255, 255, 255, 0.22)` |
| **Text: Accent** | `--ds-text-accent` | `--accent` | `--color-accent-fg` | `--color-text-accent` | `#2d6cff` |
| **Border: Default Hairline** | `--ds-border-default` | `--line` | `--color-border-default` | `--color-border-divider-default` | `rgba(255, 255, 255, 0.10)` |
| **Border: Strong** | `--ds-border-strong` | `--line-strong` | `--color-border-muted` | `--color-border-control-default` | `rgba(255, 255, 255, 0.18)` |
| **Border: Accent** | `--ds-border-accent` | `--line-accent` | `--color-accent-emphasis` | `--color-border-item-focused` | `rgba(45, 108, 255, 0.55)` |
| **Accent Primary** | `--ds-accent` | `--accent` | `--color-accent-fg` | `--color-text-accent` | `#2d6cff` |
| **Accent Hover** | `--ds-accent-hover` | `#4d85ff` | `--color-accent-emphasis` | `--color-border-item-focused` | `#4d85ff` |
| **Accent Soft** | `--ds-accent-soft` | `--accent-soft` | `--color-accent-muted` | `--color-background-control-checked` | `rgba(45, 108, 255, 0.10)` |
| **Font: Display** | `--ds-font-display` | `--f-display` | `ui-sans-serif, -apple-system` | `"Amazon Ember Display", sans-serif` | `"Archivo Black", sans-serif` |
| **Font: Prose / Sans** | `--ds-font-sans` | `--f-sans` | `-apple-system, BlinkMacSystemFont` | `"Amazon Ember", sans-serif` | `"Outfit", sans-serif` |
| **Font: Monospace** | `--ds-font-mono` | `--f-mono` | `ui-monospace, SFMono-Regular` | `"Amazon Ember Mono", monospace` | `"JetBrains Mono", monospace` |
| **Radius: Small** | `--ds-radius-sm` | `2px` | `3px` (`--primer-borderRadius-small`) | `2px` (`--border-radius-badge`) | `2px` |
| **Radius: Container / Medium** | `--ds-radius-md` | `4px` | `6px` (`--primer-borderRadius-medium`) | `8px` (`--border-radius-container`) | `4px` |
| **Radius: Pill / Full** | `--ds-radius-full` | `9999px` | `100px` | `9999px` | `9999px` |

---

## 3. Comprehensive Component Mapping Matrix

### 3.1 Atoms & Primitives

| 02Labs Component | GitHub Primer Component | AWS Cloudscape Component | Key Props & Variants | Notes & Behavioral Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **`Badge`** (`src/components/ds/Badge.astro`) | `Label` / `CounterLabel` (`@primer/react`) | `Badge` / `TokenGroup` (`@cloudscape-design/components`) | `variant`: `"default" \| "accent" \| "solid" \| "ghost" \| "counter"`, `as`: `"span" \| "a"`, `href?` | Used for CTF rank chips, blog category tags, and stack badges. In Primer, maps to `<Label variant="accent">` or `<CounterLabel>`. In Cloudscape, maps to `<Badge color="blue">`. |
| **`Button`** (`src/components/ds/Button.astro`) | `Button` (`variant="default" \| "primary" \| "invisible"`) | `Button` (`variant="normal" \| "primary" \| "link"`) | `variant`: `"default" \| "primary" \| "outline" \| "ghost" \| "icon"`, `href?`, `target?`, `rel?` | Renders semantic `<a>` when `href` is supplied; `<button>` otherwise. Automatically adds `rel="noopener noreferrer"` for external targets. |
| **`Card`** (`src/components/ds/Card.astro`) | `Box` (`borderWidth: 1`, `borderColor: "border.default"`) | `Container` (`variant="default" \| "stacked"`) | `as`: `"div" \| "article" \| "section"`, `variant`: `"default" \| "centered" \| "elevated"` | Contour-bordered container with translucent elevated backdrop. Supports card-stack controller hooks. |
| **`Breadcrumb`** (`src/components/ds/Breadcrumb.astro`) | `Breadcrumbs` (`Breadcrumbs.Item`) | `BreadcrumbGroup` (`items: [{ text, href }]`) | `items: Array<{ label: string; href?: string }>` | Generates semantic `<nav aria-label="Breadcrumb">` with accessible separators. |
| **`DataTable`** (`src/components/ds/DataTable.astro`) | Primer Table (`Markdown` table or ViewComponent) | `Table` (`columnDefinitions`, `items`) | `headers: string[]`, `rows: (string \| number)[][]`, `colWidths?: string[]` | Responsive bordered table used for CTF competition standings and metrics. |
| **`SectionHeader`** (`src/components/ds/SectionHeader.astro`) | `Subhead` / `Pagehead` | `Header` (`variant="h1" \| "h2"`, `description`, `actions`) | `title: string`, `description?`, `level?`, `actionHref?`, `actionLabel?`, `kicker?` | Standard section title with description and trailing CTA button. |

---

### 3.2 Page Sections & Organisms

| Page & Section | 02Labs Component | GitHub Primer Mapping | AWS Cloudscape Mapping | Kept Order & Invariants |
| :--- | :--- | :--- | :--- | :--- |
| **WWW: Navigation** | `Navbar.astro` | `Header` (`Header.Item`, `Header.Link`) | `TopNavigation` (`identity`, `utilities`) | Sticky blurred bar, brand anchor, main links (`Home`, `Featured`, `Blog`, `Projects`), GitHub button. Intersects `#heroSentinel` to toggle `data-scrolled`. |
| **WWW: Section 1** | `Hero.astro` | Primer Hero Showcase Container | Cloudscape Custom Header Container | **Preserved 100%:** (1) `#top [data-snap-section] [data-state="active"]`, (2) Pointer-reactive particle wave `<canvas data-hero-wave>`, (3) Eyebrow `data-animate="hero-kicker"`, (4) Headline `data-animate="hero-title"`, (5) Subtitle `data-animate="hero-sub"`, (6) `#heroSentinel`. |
| **WWW: Section 2** | `IntroSection.astro` | Primer 2-Column `Box` Layout | Cloudscape `Container` + `ColumnLayout(columns=2)` | **Preserved:** `#intro [data-snap-section]`, two-column layout (`Introduction` and `Focus (Or lack thereof)`) separated by vertical hairline divider. |
| **WWW: Section 3** | `Ch0wn3rsSection.astro` | Primer Team Card + `DataTable` + `Label` | Cloudscape `Container` + `KeyValuePairs` + `Table` | **Preserved:** `#ch0wn3rs [data-snap-section]`, Team logo (`/ch0wn3rs-logo.jpeg`), role link (`ch0wn3rs.ninja`), description, Colombia/World/Points badges, Top 5 CTF table, and CTFtime profile CTA. |
| **WWW: Section 4** | `BlogSection.astro` | Primer `Box` + Article Grid | Cloudscape `Container` + `Cards` | **Preserved:** `#blog [data-snap-section]`, SectionHeader with `All posts` CTA, 4-column latest blog post cards with date badge, title, excerpt, and `Read post` button. |
| **WWW: Section 5** | `FeaturedProjectsSection.astro` | Primer Repository Showcase + Carousel | Cloudscape `Container` + `Cards` with scroll controls | **Preserved:** `#featured [data-snap-section]`, SectionHeader with `All projects` CTA, `.carousel-wrapper`, prev/next arrow buttons, and `.featured-row` container with `ProjectCard` items. |
| **WWW: Sections 6..10** | `ProjectDetail.astro` (mapped per featured item) | Primer Item Detail / Readme Box | Cloudscape `Container` (Media + Detail + Attributes) | **Preserved:** `#project-${slug} [data-snap-section]`, Media screenshot, heading, description, highlights list, stack chips, repo and live link buttons. |
| **WWW & Blog: Footer** | `Footer.astro` | Primer Site Footer | Cloudscape App Footer | Copyright notice and smooth back-to-top anchor. |
| **Blog: Header** | `SiteHeader.astro` | `Header` | `TopNavigation` | Unified top bar linking between WWW and Blog domains. |
| **Blog: Archive Hero** | Archive Hero block | Primer `Pagehead` | Cloudscape `Header` (`variant="h1"`) | Eyebrow `02Labs · THE BLOG`, title `02loveslollipop's Blog`, lede description. |
| **Blog: Filter Bar** | `ArchiveTagBar.astro` | Primer `UnderlineNav` / `ActionList` / `SegmentedControl` | Cloudscape `Tabs` / `TokenGroup` / `SegmentedControl` | Tag chips with active indicator, post count counter, and `VIEW ALL` expandable drawer. |
| **Blog: Featured Post** | Featured Post card | Primer Highlighted Article Box | Cloudscape `Container` (Featured Card) | Large thumbnail or interactive wave canvas (`EmptyFeaturedMedia`), tags, title, excerpt, date & read time label, CTA arrow. |
| **Blog: Post List** | Post row list | Primer Issue / PR List Row | Cloudscape Table Row / Structured Item | Index code, category tags, title, read time, date, arrow. |

---

## 4. How the Codebase Enables Instant Redesign

### 4.1 If Updating to GitHub Primer
1. Add Primer CSS or React to `package.json`:
   ```bash
   npm install @primer/css
   ```
2. Activate Primer design system mode on `<html>` or `<body>`:
   ```html
   <html data-design-system="primer">
   ```
3. The `--ds-*` variables instantly bind to Primer's color system (`--color-canvas-default`, `--color-accent-fg`, etc.).
4. Under the hood, `src/components/ds/Button.astro` and `src/components/ds/Badge.astro` can directly output Primer classes (e.g., `btn btn-primary`, `Label Label--accent`) without altering `apps/www/src/pages/index.astro` or `apps/blog/src/pages/index.astro`.

### 4.2 If Updating to AWS Cloudscape Design System
1. Add Cloudscape to `package.json`:
   ```bash
   npm install @cloudscape-design/components @cloudscape-design/global-styles
   ```
2. Activate Cloudscape mode:
   ```html
   <html data-design-system="cloudscape">
   ```
3. The `--ds-*` variables instantly bind to Cloudscape's dark theme tokens (`--color-background-layout-main`, `--color-text-body-default`, etc.).
4. The atomic components in `src/components/ds/*` map 1:1 to Cloudscape React components or Cloudscape styled primitives.

---

## 5. Summary of Files Updated & Added

- `apps/www/src/styles/design-system.css`: Canonical `--ds-*` design token contract + Primer/Cloudscape adapters.
- `apps/blog/src/styles/design-system.css`: Blog canonical token contract + adapters.
- `apps/www/src/styles/global.css`: Bridged to canonical tokens via `@import "./design-system.css"`.
- `apps/blog/src/styles/global.css`: Bridged to canonical tokens via `@import "./design-system.css"`.
- `apps/www/src/components/ds/`:
  - `Badge.astro` (maps to Primer Label / Cloudscape Badge)
  - `Button.astro` (maps to Primer Button / Cloudscape Button)
  - `Card.astro` (maps to Primer Box / Cloudscape Container)
  - `SectionHeader.astro` (maps to Primer Subhead / Cloudscape Header)
  - `Breadcrumb.astro` (maps to Primer Breadcrumbs / Cloudscape BreadcrumbGroup)
  - `DataTable.astro` (maps to Primer Table / Cloudscape Table)
- `apps/www/src/components/sections/`:
  - `IntroSection.astro` (decoupled introduction & focus section)
  - `Ch0wn3rsSection.astro` (decoupled CTF standings & team profile)
  - `BlogSection.astro` (decoupled latest technical writeups)
  - `FeaturedProjectsSection.astro` (decoupled project highlights carousel)
  - `Footer.astro` (reusable site footer)
- `apps/www/src/components/Hero.astro`: Enhanced with customizable props while preserving 100% of DOM IDs, interactive canvas, and animation hooks.
- `apps/www/src/components/ProjectCard.astro`: Refactored to consume `Button` and `Badge`.
- `apps/www/src/components/ProjectDetail.astro`: Refactored to consume `Button`.
- `apps/www/src/pages/index.astro`: Streamlined to high-level semantic components with zero loss of functionality.
- `apps/www/src/pages/projects/[slug].astro`: Updated with `Breadcrumb` and `Footer`.
- `apps/www/src/pages/projects/index.astro`: Updated with `SectionHeader` and `Footer`.
- `apps/blog/src/components/EmptyFeaturedMedia.astro`: Resolved all TypeScript compilation errors.
- `apps/blog/src/components/ds/`: Replicated atomic primitives for blog alignment.
