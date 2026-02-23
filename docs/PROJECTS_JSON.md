# Projects JSON (apps/www)

## Location

- Project entries live in `apps/www/src/content/projects/`.
- Each file is one project: `apps/www/src/content/projects/<slug>.json`.

## Validation

- Schema is enforced at build time via Astro content collections:
  - `apps/www/src/content/config.ts`

## Required Fields

```json
{
  "slug": "string",
  "title": "string",
  "summary": "string",
  "description": "string",
  "featured": true,
  "order": 1,
  "stack": ["string"],
  "links": {
    "repo": "https://…",
    "detailsLabel": "View details"
  }
}
```

## Optional Fields

- `image.src`: string (path under `apps/www/public/` like `/projects/my-project.svg`)
- `image.alt`: string (alt text for the card/detail image)
- `highlights`: `string[]`
- `links.live`: URL string
- `links.cta.href`: URL string (used for the **second** button next to GitHub in featured cards)
- `links.cta.label`: string (button label)
- `card.badge`: string (small label above title)
- `card.layout`: `"minimal" | "dense"`

## Featured Selection

- Home page pulls:
  - all projects where `featured: true`
  - sorted by `order`
  - takes the first 5
- Implementation:
  - `apps/www/src/pages/index.astro`

## Adding A Project

1. Create `apps/www/src/content/projects/<slug>.json`.
2. Fill required fields; keep UI text short for cards.
3. If you want it to appear in the featured row, set:
   - `featured: true`
   - `order` so it sorts into the first 5
