# Orka landing page

Orka’s marketing website, written in HTML, CSS and vanilla JavaScript. There is no Astro, React or other frontend framework. A small Cloudflare-compatible Worker powers the website preview’s metadata endpoint.

## Local checks and build

Use Node.js 22 or newer. The build and tests have no external dependencies.

```sh
npm test
npm run build:pages
```

The Pages build is written to `dist/client`. It includes the page, images, local fonts, content-hashed CSS/JavaScript, cache headers, and `_worker.js` for `/api/*` requests. Static assets are served directly by Pages.

To preview the full site with its backend, use Cloudflare’s Wrangler CLI:

```sh
npx wrangler pages dev dist/client
```

## Cloudflare Pages

Connect the GitHub repository `charlesmdp/orka` to a **Pages** project using these settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Root directory | Repository root |
| Build command | `npm test && npm run build:pages` |
| Build output directory | `dist/client` |
| Node version | `22` (also specified in `.node-version`) |

`wrangler.jsonc` holds the Pages output path, runtime compatibility date and public Supabase project URL. The API must be deployed along with the static files so “See Orka on your website” keeps working.

The site respects third-party iframe restrictions. When a site cannot be embedded, the modal uses its public metadata in a branded preview instead.

## Supabase

Target project: `https://ppglbozceswzrykhwbpq.supabase.co`.

Copy `.dev.vars.example` to `.dev.vars` and set `SUPABASE_PUBLISHABLE_KEY` to the project’s publishable key. Configure the same key as a runtime variable in the Cloudflare Pages project. Keep `.dev.vars` out of version control.

```sh
npm run check:supabase
```

This checks the project’s Auth settings endpoint without changing any data. It does not prove table access or Row Level Security policies. The landing currently links sign-in and registration to `dashboard.orka.chat`; it does not create accounts, store visitor data or write to Supabase. Adding database features requires a defined data model and access policies. The project URL alone is not an authenticated connection.

Use a publishable key or the project’s legacy `anon` key for public access. Never put a `service_role` or `sb_secret_` key in frontend code or this repository.

## Source layout

- `public/`: landing page, styles, interactions, images and fonts.
- `server/index.mjs`: website metadata API and static asset fallback.
- `scripts/build.mjs`: Sites and Cloudflare Pages build targets.
- `scripts/check-supabase.mjs`: read-only Supabase connection check.
- `tests/`: metadata API and deployment checks.

The original Sites build remains available with `npm run build`; it writes `dist/client`, `dist/server` and its hosting manifest. Cloudflare Pages uses `npm run build:pages` instead.

## Provider references

- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Pages advanced Worker mode](https://developers.cloudflare.com/pages/functions/advanced-mode/)
- [Pages configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
