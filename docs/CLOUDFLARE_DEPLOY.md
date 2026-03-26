# Cloudflare Deploy Notes

This repo contains two static Astro apps:

- `apps/www` for `02labs.me`
- `apps/blog` for `blog.02loveslollipop.uk`

Both apps now include a `wrangler.jsonc` configured for assets-only deploys:

- `apps/www/wrangler.jsonc`
- `apps/blog/wrangler.jsonc`

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
