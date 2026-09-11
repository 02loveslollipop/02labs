# Cloudflare Deploy Notes

This repo contains two Astro apps, both deployed as fully static sites:

- `apps/www` for `02labs.me` — **Cloudflare Pages** (project `02labs-www`)
- `apps/blog` for `blog.02labs.me` — Cloudflare Workers

For the blog deployment, attach both `blog.02labs.me` and `blog.02loveslollipop.uk`
to the same Worker/custom-domain setup so the blog worker can issue a `301`
from the legacy `.uk` host to `blog.02labs.me` while preserving path and query.

## www on Cloudflare Pages

The site is fully static (all pages prerendered). It deploys to Cloudflare
Pages in **advanced mode**: a single-file `_worker.js` (installed into `dist/`
by the astro build hook from `apps/www/pages-worker.js`) serves the static
assets via `env.ASSETS` and applies the legacy-host redirects, the
markdown-for-agents negotiation, and the security headers on every request.

Notes (all verified empirically — each cost an hour):

- The Astro Cloudflare adapter emits `_worker.js/` (SSR server), `_routes.json`,
  and `_headers.json` into `dist/`. A `_routes.json` in the output is fatal for
  advanced mode: it switches Pages to the Functions route model and disables
  `_worker.js`. The build hook removes those artifacts and installs the
  single-file worker. Do not re-add `_routes.json`.
- `public/.assetsignore` must NOT ignore `_worker.js` (or wrangler drops it).
- Deploy with an explicit `./dist` directory and `--project-name`; a
  `pages_build_output_dir` in wrangler.jsonc changes deploy semantics.

Pages project setup (done once):

```bash
cd apps/www
npx wrangler pages project create 02labs-www --production-branch main
npx wrangler pages deploy ./dist --project-name 02labs-www
```

Custom domains (dashboard, Workers & Pages → 02labs-www → Custom domains):
`02labs.me`, `www.02labs.me`, `02loveslollipop.uk`, `www.02loveslollipop.uk`.
Remove them from the old `02labs-www` Worker first — a hostname can only be
attached to one service at a time.

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
  → `astro build` → `wrangler pages deploy ./dist --project-name 02labs-www`
  → save snapshot to the Actions cache.
- The `CLOUDFLARE_API_TOKEN` secret needs the **Cloudflare Pages: Edit**
  permission in addition to Workers for the blog workflow.

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
npm run deploy:www   # builds, then `wrangler pages deploy`

# Blog site
npm run deploy:blog
```
