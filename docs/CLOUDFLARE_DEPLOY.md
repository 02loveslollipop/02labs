# Cloudflare Deploy Notes

This repo contains two static Astro apps:

- `apps/www` for `02labs.me`
- `apps/blog` for `blog.02labs.me`

Both apps now include a `wrangler.jsonc` configured for assets-only deploys:

- `apps/www/wrangler.jsonc`
- `apps/blog/wrangler.jsonc`

For the blog deployment, attach both `blog.02labs.me` and `blog.02loveslollipop.uk`
to the same Worker/custom-domain setup so the blog worker can issue a `301`
from the legacy `.uk` host to `blog.02labs.me` while preserving path and query.

## Why the previous deploy failed

`wrangler deploy` was executed without a Worker entrypoint (`main`) and without an assets directory (`assets.directory`), so Wrangler had nothing to publish.

## Deploy commands

Run inside each app directory:

```bash
# Main site
cd apps/www
npm run build
npx wrangler deploy
```

```bash
# Blog site
cd apps/blog
npm run build
npx wrangler deploy
```

## Cloudflare CI settings (Workers Builds)

Set each Cloudflare project to the corresponding app root:

- Root directory: `apps/www` (or `apps/blog`)
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

If you keep the root at repo top-level instead, use workspace commands:

- Build: `npm -w apps/www run build` (or `npm -w apps/blog run build`)
- Deploy: `npx wrangler deploy --config apps/www/wrangler.jsonc` (or blog config path)
