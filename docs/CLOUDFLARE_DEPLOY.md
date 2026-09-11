# Cloudflare Deploy Notes

This repo contains two Astro apps, both deployed to Cloudflare Workers as
fully static sites (all pages prerendered at build time):

- `apps/www` for `02labs.me`
- `apps/blog` for `blog.02labs.me`

For the blog deployment, attach both `blog.02labs.me` and `blog.02loveslollipop.uk`
to the same Worker/custom-domain setup so the blog worker can issue a `301`
from the legacy `.uk` host to `blog.02labs.me` while preserving path and query.

## CI/CD (GitHub Actions)

Both apps deploy automatically from `main`:

### `deploy-blog.yml`

- Trigger: push to `main` touching `apps/blog/**`, or manual `workflow_dispatch`.
- Steps: `npm ci` → `astro build` → `wrangler deploy`.

### `deploy-www.yml`

- Triggers:
  - Push to `main` touching `apps/www/**` or `scripts/sync-ctftime.mjs`.
  - Weekly `schedule` (Mondays 06:00 UTC) so the CTFtime data baked into the
    static HTML stays current.
  - `workflow_run` after a successful blog deploy (the homepage and `/blog/`
    mirror posts from `blog.02labs.me` at build time).
  - Manual `workflow_dispatch`.
- Steps: `npm ci` → restore cached CTFtime snapshot → `npm run sync:ctftime`
  → `astro build` → `wrangler deploy` → save snapshot to the Actions cache.

### CTFtime data and the snapshot cache

CTFtime (team 408704 / Ch0wn3rs) ratings and event results are fetched at
build time by `scripts/sync-ctftime.mjs`, which writes
`apps/www/src/data/ctftime-snapshot.json`. The site renders entirely from that
snapshot — there is no runtime fetching, no KV, and no sync worker anymore
(the old `ctftime-sync` worker and `api.02labs.me` endpoint were retired; the
JSON data now lives at `https://02labs.me/api/ctftime.json`).

Failure handling: if the CTFtime API is unreachable during a build, the
workflow restores the snapshot from the last successful run (GitHub Actions
cache, `ctftime-snapshot-*` keys) and deploys with the previous data. The job
only fails when no snapshot exists at all. The cache expires after 7 days of
no access, which the weekly schedule always refreshes.

A baseline snapshot is committed to the repo, so a cold cache can never break
a deploy.

## Manual deploys

Run from the repo root (or inside each app directory):

```bash
# Main site (fetch fresh CTFtime data first if you want current numbers)
npm run sync:ctftime
npm run deploy:www

# Blog site
npm run deploy:blog
```
