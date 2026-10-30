# Stellar Blade Guide - client

The React single-page app for [Stellar Blade Guide](../README.md). See the root README for the project overview, backend, and dev-container setup.

## Stack

- **React 19** + **TypeScript**
- **Vite** (dev server + build)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **React Router v7** for routing
- **TanStack Query** for server state (content reads, search, progress and stats, comments, notifications)
- `yet-another-react-lightbox` for the full-size image viewer, `lucide-react` for icons
- **Vitest** for unit tests

## Running

From the repo root, `npm run dev` starts the backend and this client together. To run only the client, from this directory (or `npm run client` from the root):

```bash
npm run dev          # Vite on http://localhost:3000
```

The dev server proxies `/api` to the backend on `:8000` (see `vite.config.ts`), so the FastAPI server must be running for content to load. `VITE_API_BASE_URL` overrides the API base URL (defaults to `/api`).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server on `:3000` (HMR) |
| `npm run build` | Type-check (`tsc -b`) then build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint (type-checked flat config) |
| `npm test` | Vitest unit tests, one run |
| `npm run test:watch` | Vitest in watch mode |

## Structure

```
src/
  main.tsx           entry: provider stack (ErrorBoundary > QueryClientProvider > Toast > Auth)
  App.tsx            all routes (BrowserRouter), nested under RootLayout
  index.css          Tailwind import, the navbar height and jump offset (scroll-anchor),
                     brand colours, scrollbars, 16px form text on touch screens, print styles
  pages/             route components: the home page, five thin index pages over the shared
                     CategoryIndexPage, the walkthrough category lists, three scroll-spy
                     detail pages (walkthrough, level, collectible type), a Blood Rain news
                     page, plus auth/account (including Progress), legal, and error pages
  components/        reusable UI: the shared index page and cards, image gallery, table of
                     contents, SEO and structured data, search, comments, notifications,
                     the Manage progress card, navbar, skeletons, modals
  hooks/             one data-domain hook per resource (collectibles, walkthroughs, progress,
                     user stats, comments, notifications, search) plus useAuth (with
                     authFetch) and useAuthContext, useBulkProgress, useHandClearTip,
                     usePrefetch, useFloatingControl, and the useActiveSection scroll-spy
  context/           AuthContext (session + token lifecycle), ToastContext
  layouts/           RootLayout (scroll reset + navbar + outlet + footer)
  services/          api.ts: typed fetch wrappers for content and search + most TypeScript
                     interfaces (comment, notification, and auth types live in their hooks)
  constants/         navigation structure, section names, type intros, cycle labels, Manage
                     progress copy, and seo.json (the site's static head text and images,
                     also read by the server) with typed views over it (category images,
                     level, type, and walkthrough SEO)
  utils/             image URL/srcset helpers (image.ts), image cache, slug
                     generation and dedup, TOC builders, description parser,
                     text layout, username and password validation, breadcrumbs,
                     auth helpers (refresh lock, return path, OAuth errors), and
                     the pure logic behind the Progress page, its Manage progress
                     card, and the tip that points to it
public/              robots.txt, static sitemap.xml, favicons, README screenshots;
                     assets/images/ is gitignored local source imagery (production serves
                     from Cloudflare R2 at img.stellarbladeguide.com)
```

Route shape: `/walkthroughs/:type` (a category's list), `/walkthroughs/:type/:slug`, `/levels/:levelName`, and `/collectibles|upgrades|cosmetics/:typeName`. The three collectible categories share one detail page (`CollectibleTypeDetailPage`), and `useActiveSection` drives the scroll-spy table of contents on all three detail pages.

## Data fetching

`services/api.ts` wraps `fetch` with typed helpers for the content reads and search, and holds most of the API's TypeScript interfaces (the comment, notification, and auth types live in their hooks), maintained by hand to mirror the server's Pydantic schemas. Most signed-in requests go through `authFetch` (`hooks/useAuth.ts`), which attaches the access token (refreshing first when none is held) and, on a 401, refreshes it and retries once. One hook module per domain wraps TanStack Query. Content queries default to a 30-minute `staleTime` (1-hour `gcTime`); user data (progress, comments, notifications) uses shorter windows.

## Images

Content images are served from Cloudflare R2 (`img.stellarbladeguide.com`) as pre-generated WebP files, five sizes each: a responsive `srcSet` ladder (`GALLERY_WIDTHS = [640, 960, 1200, 1600]` in `utils/image.ts`) with `sizes` strings derived from the real rendered layout widths at each breakpoint, plus the full-size WebP the lightbox opens. The home hero's ladder adds 1,920 and 2,560 px. Variants use a filename suffix (`{name}-w960.webp`). `predictRenderedWidth()` predicts which ladder variant the browser will request, and `utils/imageCache.ts` keeps a set of already-loaded URLs so `ImageGallery` can skip skeleton states for images the prefetcher already warmed. Avatars are not on R2: an avatar set in Settings is re-hosted on Cloudinary, and an account created through Google or Discord starts with the provider's picture, if it has one. The server-side pipeline that produces and uploads the variants is documented in `../server/scripts/images/PIPELINE.md`.

## Prefetching

`usePrefetch` fires on hover from cards, nav menus, search results, type badges, Progress page rows, and next/previous links; on touch in the mobile nav; and on hover, touch, and focus from links inside collectible and walkthrough text (`PrefetchableLink`). It warms the TanStack Query cache using the same query keys as the real hooks. For a level, type, or walkthrough page it then warms the images of the first three collectibles (or of the walkthrough's first two sections with images) through a detached `<img>` carrying the gallery's own `srcset` and `sizes`, so the browser picks a candidate the same way it will for the gallery; each finished download is recorded in `utils/imageCache.ts`. Anchor links (for example from search results) warm only the target collectible's images, found with the same slug and dedup logic (`utils/slugify.ts`) the pages use.

## SEO and structured data

There is no react-helmet; the app relies on React 19's native metadata hoisting. `components/SEO.tsx` returns `<title>`, meta / Open Graph / Twitter tags, and a canonical link that React lifts into `<head>`; `components/StructuredData.tsx` injects JSON-LD (WebSite on the homepage, BreadcrumbList, WebPage / Article / CollectionPage, and ItemList on index, walkthrough category, level, and type pages). In production, FastAPI serves the app and splices per-route head tags into the built React shell at its `<!--seo-->` marker (`../server/app/seo_head.py`), from the same `constants/seo.json` the pages import and, for walkthroughs, from the database row through the API's own cache key, so link previews and non-JS crawlers get each page's own title, description, and preview card without SSR. `main.tsx` removes those `data-seo="server"` tags before mount, so React owns the head in the browser. JSON-LD is rendered in the browser only, so only crawlers that execute JavaScript see it. `public/robots.txt` and the static `public/sitemap.xml` complete the picture.

## Progress and auth state

Guests' completed collectible IDs live in `localStorage` (`sb_progress`). On sign-in the client merges them into the account (`POST /api/progress/sync`, additive only) and, once the server accepts them, drops the IDs it sent from the key; from then on progress is API-backed. Checkmarks send intents (`PUT` to set, `DELETE` to clear), never a toggle: each one updates the cache optimistically and rolls back on failure, and a no-op answer triggers a re-sync. The access token is held in memory only, never persisted; the app refreshes it through the HttpOnly refresh cookie on load when a session hint is set, every 14 minutes, when a returning tab's token is missing or more than 10 minutes old, and from `authFetch` when a request finds no token or gets a 401. The OAuth callback page uses the token in the URL only as a success signal, never stores it, and authenticates off the cookie instead.

## Tailwind v4 caveat

Tailwind v4 generates CSS from the current file inventory, so an in-place build over a dirty tree (deleted-but-unstaged files, case-only renames) can silently drop classes; the navbar is the usual casualty. Builds from a clean checkout are always correct, and so are Docker builds, which is how deploys are built. If a local build looks unstyled, rebuild from a clean tree before debugging anything else.

## Verification

`npm test` runs 222 Vitest unit tests in 21 files, colocated with the modules they cover (`src/**/*.test.ts`); they test pure logic only, with no jsdom or component tests. CI runs `npm run lint` (a type-checked ESLint config), `npm test`, and `npm run build` (`tsc -b` in strict mode, then the production build) on every pull request and every push to main. Behaviour that depends on timing, the network, or the real servers is left to the Playwright suite in `../e2e/` (192 tests in 27 specs, `npm run e2e` from the repo root), which drives the real FastAPI and Vite dev servers in the dev container before merging and is not part of CI.
