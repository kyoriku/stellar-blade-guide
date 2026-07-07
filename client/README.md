# Stellar Blade Guide - client

The React single-page app for [Stellar Blade Guide](../README.md). See the root README for the project overview, backend, and dev-container setup.

## Stack

- **React 19** + **TypeScript**
- **Vite** (dev server + build)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **React Router v7** for routing
- **TanStack Query** for server state (content reads, progress, comments, search)
- `yet-another-react-lightbox` for image galleries, `lucide-react` for icons

## Running

From the repo root, `npm run dev` starts the backend and this client together. To run only the client:

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

## Structure

```
src/
  main.tsx           entry: provider stack (ErrorBoundary > QueryClientProvider > Toast > Auth)
  App.tsx            all routes (BrowserRouter), nested under RootLayout
  index.css          Tailwind import + custom utility classes (brand colours, scrollbars)
  pages/             route components: six thin index pages over the shared CategoryIndexPage,
                     three scroll-spy detail pages (walkthrough, level, collectible type),
                     plus auth/account, legal, and error pages
  components/        reusable UI: the shared index page and cards, image gallery, table of
                     contents, SEO and structured data, comments, navbar, skeletons, modals
  hooks/             one data-domain hook per resource (collectibles, walkthroughs, progress,
                     comments, notifications, search) plus usePrefetch and the useActiveSection
                     scroll-spy
  context/           AuthContext (session + token lifecycle), ToastContext
  layouts/           RootLayout (scroll reset + navbar + outlet + footer)
  services/          api.ts: typed fetch wrappers + all TypeScript interfaces
  constants/         navigation structure, category images, per-type SEO copy
  utils/             Cloudinary URL/srcset helpers, image cache, slug generation and dedup,
                     TOC builders, description parser, username validation
public/              robots.txt, static sitemap.xml, favicons, README screenshots;
                     assets/images/ is gitignored local source imagery (production serves
                     from Cloudinary)
```

Route shape: `/walkthroughs/:type/:slug`, `/levels/:levelName`, and `/collectibles|upgrades|materials|cosmetics/:typeName`. The four collectible categories share one detail page (`CollectibleTypeDetailPage`), and `useActiveSection` drives the scroll-spy table of contents on all three detail pages.

## Data fetching

`services/api.ts` wraps `fetch` with typed helpers and holds every TypeScript interface, maintained by hand to mirror the server's Pydantic schemas. One hook module per domain wraps TanStack Query. Content queries default to a 30-minute `staleTime` (1-hour `gcTime`); user data (progress, comments, notifications) uses shorter windows.

## Images

Everything is served from Cloudinary with a responsive `srcSet` ladder (`GALLERY_WIDTHS = [400, 640, 960, 1200, 1600]` in `utils/cloudinary.ts`) and `sizes` strings derived from the real rendered layout widths at each breakpoint. `predictRenderedWidth()` computes which ladder variant the browser will actually request, and `utils/imageCache.ts` keeps a set of already-loaded URLs so `ImageGallery` can skip skeleton states for images the prefetcher already warmed.

## Prefetching

`usePrefetch` fires on hover, touch, and focus (from `CategoryCard` and `PrefetchableLink`). It warms the TanStack Query cache using the same query keys as the real hooks, then preloads the above-fold images with `<link rel="preload" as="image">` tags carrying the same `imagesrcset` / `imagesizes` the gallery will render, so navigation paints instantly. Anchor links (for example from search results) prefetch just the target collectible, using the same slug and dedup logic (`utils/slugify.ts`) the pages use.

## SEO and structured data

There is no react-helmet; the app relies on React 19's native metadata hoisting. `components/SEO.tsx` returns `<title>`, meta / Open Graph / Twitter tags, and a canonical link that React lifts into `<head>`; `components/StructuredData.tsx` injects JSON-LD (WebSite on the homepage, BreadcrumbList, WebPage / Article / CollectionPage, and ItemList on index pages). `public/robots.txt` and the static `public/sitemap.xml` complete the picture. Because meta tags are client-rendered, crawlers must execute JavaScript to see them.

## Progress and auth state

Guests' completed collectible IDs live in `localStorage` (`sb_progress`). On login the client syncs them to the server (`POST /api/progress/sync`) and clears the key; from then on progress is API-backed with optimistic toggles and rollback on failure. The access token is held in memory only, never persisted; the app refreshes it proactively on an interval and on tab focus via the HttpOnly refresh cookie. The OAuth callback page ignores the token in the URL and authenticates off the cookie instead.

## Tailwind v4 caveat

Tailwind v4 generates CSS from the current file inventory, so an in-place build over a dirty tree (deleted-but-unstaged files, case-only renames) can silently drop classes; the navbar is the usual casualty. Builds from a clean checkout are always correct. If a deploy looks unstyled, rebuild from a clean tree before debugging anything else.

## Verification

There is no client test suite. The gates are `tsc -b` (strict mode, runs as part of `npm run build`), a type-checked ESLint config, the production build itself, and manual smoke testing against the running app.
