# 02Labs Design Rules

## Core Principles

- **UI is grayscale.** Use black/white/gray for text, borders, surfaces, and shadows.
- **Only one color accent.** `--accent` is allowed **only** on hover/focus states (links, borders, text).
- **Background exception.** The animated navy/cobalt wash is allowed as a behind-everything atmosphere layer.
- **Motion is intentional.** A single anime.js intro + section “card flip” reveal. Respect `prefers-reduced-motion`.

## Typography

- Primary font: **Outfit** (Google Fonts).
- Portfolio app: `apps/www/src/layouts/BaseLayout.astro`
- Blog app: `apps/blog/src/layouts/BaseLayout.astro`
- Guidance:
  - Hero title uses heavy weight (800–900).
  - Body text uses mid weights (450–600).

## Color Tokens

Portfolio (`apps/www/src/styles/global.css`):

- Grayscale UI:
  - `--bg`, `--fg`, `--fg-dim`, `--stroke`
  - `--surface`, `--ink`, `--ink-dim`, `--ink-stroke`
- Accent:
  - `--accent: #2d6cff`
- Background wash (blue exception):
  - Implemented in `.bg .bg-wash` gradients

Blog (`apps/blog/src/styles/global.css`) uses the same concept with slightly different values for readability.

## Components

### Background Wash

- Portfolio: `apps/www/src/components/Background.astro`
- Blog: `apps/blog/src/components/Background.astro`
- Implementation: a fixed `.bg` layer + `.bg-wash` radial gradients + subtle drift keyframes.

### Navbar (Portfolio)

- Component: `apps/www/src/components/Navbar.astro`
- Behavior:
  - On hero: transparent, blurred, white text
  - After hero: near-white bar with **black** bottom border and **black** text
- Implementation:
  - `apps/www/src/scripts/home.ts` toggles `data-scrolled="true"` on `#siteNav` using an IntersectionObserver.

### Sections (“Flipping Cards”)

- Each section uses:
  - `height: 100vh` / `100svh`
  - `scroll-snap-align: center` (snap is set to `y proximity` on `html, body`)
- Card flip effect:
  - Sections with `data-snap="card"` get a 3D tilt + opacity reduction by default
  - `apps/www/src/scripts/home.ts` toggles `data-active="true"` to “flip in”
- Reduced motion:
  - Card transforms and scroll-snap are disabled when `prefers-reduced-motion: reduce`.

## Hover / Focus Rules

- Links/buttons use grayscale by default.
- On hover/focus-visible:
  - text can become `--accent`
  - borders can become `--accent`
  - do not introduce any other colors
