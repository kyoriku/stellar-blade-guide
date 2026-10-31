# Stellar Blade Guide - server

The FastAPI backend for [Stellar Blade Guide](../README.md). It serves all guide content (collectibles, walkthroughs, levels), full-text search, accounts and progress tracking, threaded comments with AI moderation, and (in production) the built React SPA. See the root README for the project overview and dev-container setup.

## Stack

- **Python 3.14** + **FastAPI** (async route handlers)
- **SQLAlchemy 2.0** (async, `asyncpg` driver) + **Pydantic v2**
- **PostgreSQL** (content, users, progress, comments, notifications) + **Redis** (cache, rate limiting, sessions)
- **PyJWT** + **passlib/argon2** for auth
- **Cloudflare** (the CDN and edge cache in front of the app) and **Cloudflare R2** (content images), **Railway** (hosting for the app, PostgreSQL, and Redis), **Cloudinary** (user avatars only), **OpenAI Moderation API** (comments and avatars), **Resend** (password-reset email)
- Managed with [uv](https://docs.astral.sh/uv/); tested with **pytest**

## Layout

```
app/
  main.py            FastAPI app: middleware stack, router mounting; hands SPA serving to seo_head.py
  seo_head.py        serves the built SPA, with each route's head tags spliced into index.html
  config/
    settings.py      env-sourced settings (see Environment Variables)
  core/
    auth.py          JWT create/decode, refresh-token helpers, get_current_user / require_role deps
    cache.py         Redis client + response-cache helpers (get / set / invalidate by pattern)
    security.py      client-IP resolution + slowapi rate limiter (Redis storage, in-memory fallback)
    logging.py       logging setup, and the cleaners every copied log field goes through (escaped, capped, no email addresses)
    colours.py       ANSI colour constants for terminal output
    passwords.py     the password rule: 8 to 128 characters for a new password
    usernames.py     the username rule, and the cleaner a provider's display name goes through
    navigation.py    walkthrough URL spellings, levels with a page, and search's page titles, from seo.json
    ids.py           the int4 check run on every client-supplied id before any query
    segments.py      the printable-text check every level, type, and walkthrough lookup runs first
    http_cache.py    weak ETag comparison, shared by the ETag middleware and seo_head.py
  db/
    database.py      async engine + session factory (bounded query timeouts), get_db() dependency
  models/            SQLAlchemy ORM: collectibles, walkthroughs, users, progress, comments, notifications
  routers/           route handlers per resource, with their cache orchestration
  schemas/           Pydantic request/response models
  services/          business logic: auth, oauth_state, collectibles, comments, search, users, and
                     search_text (the expressions behind the stored search columns)
  middleware/        request-pipeline layers (see Middleware) + rate-limiter and exception-handler setup
scripts/
  dev_workflow.py    one-command content pipeline (generate variants, upload, update URLs, load the dev database)
  prod_seed.py       production content deploy (step by step in content-seeding-runbook.md)
  search_eval.py     read-only search checks and timing against real PostgreSQL
  db/                schema bootstrap with the starting levels, types, and locations
                     (seed_db.py), the content writers (seed_collectibles.py,
                     seed_walkthroughs.py), their bounded engine (seed_guard.py), and the
                     production connection check (check_connections.py)
  cache/             Redis clears and stats, and the scoped Cloudflare purge with its ledger
                     (purge_api_cache.py, purge_manifest.py)
  images/            R2 image pipeline (generate_variants.py, upload_r2.py, update_r2_urls.py,
                     prune_bucket.py; full flow documented in images/PIPELINE.md)
  migrations/        one-off schema migrations, run by hand (no Alembic; gitignored, so none are in the repo)
seed-data/           JSON source of truth for all content (its own private git repository, gitignored
                     here; carries its own README)
tests/               pytest suite (test modules + conftest.py)
pyproject.toml       dependencies + pytest config
```

## Running

Everything runs from the `server/` directory with `uv`. From the repo root, `npm run server` starts the API, and `npm run dev` starts it with the client (see the root README).

```bash
uv sync                                    # install dependencies
uv run uvicorn app.main:app --reload       # dev server on :8000
```

`DATABASE_URL` must point at a PostgreSQL instance and `REDIS_URL` at a Redis instance; the dev container provides and wires both automatically. Interactive API docs at `http://localhost:8000/docs` are available only when `DEBUG=True` (disabled in production). Search needs the `pg_trgm` extension (for `similarity()`) and the stored `search_vector` columns on `collectibles` and `walkthroughs`; `scripts/db/seed_db.py` creates both and rebuilds a column whose expression has changed, while production gets them from a hand-run migration.

## Environment Variables

Configuration is read from the environment. Locally, `server/.env` (gitignored) fills in anything the environment leaves unset; `.dockerignore` keeps it out of the image, so production reads only the variables Railway gives it. Every non-secret default is production's value, and an unset `ENVIRONMENT` means production, so a local `server/.env` starts with `ENVIRONMENT=development`. Secrets should be generated fresh per environment (`openssl rand -hex 32` works for the two signing/shared secrets).

| Variable | Purpose |
|---|---|
| `ENVIRONMENT` | `production` (the default) or `development`, nothing else. Production gives the auth cookies `Secure` and `Domain=.stellarbladeguide.com`, refuses `DEBUG=True`, and refuses to start without the variables listed below the table |
| `DEBUG` | `True` enables `/docs`, turns off the origin check, the bot filter, and the CSP header, shows SQL parameters in database errors, and re-reads the built `index.html` on every request, for local development; needs `ENVIRONMENT=development` |
| `CACHE_TTL` | TTL in seconds for cached API responses, in Redis and as the Cloudflare edge's `s-maxage` (defaults to 30 days; dev sets `300`, five minutes); search uses its own one-hour TTL |
| `DATABASE_URL` | PostgreSQL DSN; `postgresql://` or `postgresql+asyncpg://` (normalized automatically). In dev, for example `postgresql+asyncpg://postgres:postgres@localhost:5432/stellarblade` |
| `REDIS_URL` | Redis instance used for the cache, rate limiter, and sessions. In dev, for example `redis://localhost:6379` |
| `JWT_SECRET_KEY` | signing key for access tokens; required at startup |
| `FRONTEND_URL` | the origin the browser uses (default `https://stellarbladeguide.com`; `http://localhost:3000` in dev). Builds the OAuth callbacks, `{FRONTEND_URL}/api/auth/{google,discord}/callback`, the redirects after sign-in, and password-reset links |
| `OPENAI_API_KEY` | comment and avatar moderation (comment moderation fails open if OpenAI is unreachable; avatar moderation fails closed with a 503) |
| `RESEND_API_KEY` | transactional email (password reset) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account (user avatars only) |
| `CLOUDINARY_API_KEY` | Cloudinary API key (avatars only) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (avatars only) |
| `GOOGLE_CLIENT_ID` | Google OAuth client id. In dev, register `http://localhost:3000/api/auth/google/callback` on the client: the callback is built from `FRONTEND_URL` and reaches uvicorn through Vite's `/api` proxy |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `DISCORD_CLIENT_ID` | Discord OAuth client id. In dev, register `http://localhost:3000/api/auth/discord/callback` on the client: the callback is built from `FRONTEND_URL` and reaches uvicorn through Vite's `/api` proxy |
| `DISCORD_CLIENT_SECRET` | Discord OAuth client secret |
| `R2_ACCOUNT_ID` | Cloudflare account id for the R2 S3 endpoint (image pipeline scripts only) |
| `R2_ACCESS_KEY_ID` | R2 API token access key (image pipeline scripts only) |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret (image pipeline scripts only) |
| `R2_BUCKET` | R2 bucket holding content images (image pipeline scripts only) |
| `R2_PUBLIC_BASE_URL` | public base URL images are served from, `https://img.stellarbladeguide.com` (image pipeline scripts only) |
| `PROD_DATABASE_URL` | production PostgreSQL through the SSH tunnel you open by hand, `postgresql://postgres:<password>@host.docker.internal:15432/railway` (only the scripts that reach production; see `scripts/images/PIPELINE.md`, Seeding prod) |
| `PROD_REDIS_URL` | production Redis through its SSH tunnel, `redis://default:<password>@host.docker.internal:16379` (only the scripts that reach production) |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone for the edge purges after a content deploy (`prod_seed.py`, `scripts/cache/purge_api_cache.py`) and after `upload_r2.py --overwrite` replaces images (only the scripts that reach production) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with cache-purge permission (only the scripts that reach production) |
| `ORIGIN_SECRET` | production only: the shared secret every request but Railway's health check must carry, added by Cloudflare (origin check middleware); `DEBUG` skips the check, so dev never uses it |
| `ALLOWED_HOSTS` | optional (default: the site's two hosts and `healthcheck.railway.app`, plus `localhost` and `127.0.0.1` in development): comma-separated Host-header allowlist for TrustedHost validation. Setting it replaces the whole list, so keep `healthcheck.railway.app` in it: without it, Railway's health checks fail, and so does every deploy |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | optional (default 15): access-token lifetime in minutes |
| `REFRESH_TOKEN_EXPIRE_DAYS` | optional (default 7): refresh-token idle lifetime; a session with no refresh for this many days ends |
| `REFRESH_GRACE_SECONDS` | optional (default 60): how long a just-rotated refresh token is still accepted, so a refresh whose response was lost recovers |
| `SESSION_MAX_AGE_DAYS` | optional (default 90, and at least 1): absolute session lifetime, counted from sign-in however often the token rotates |
| `LOG_LEVEL` | optional (default `INFO`): logging level |

Production refuses to start unless each of these is set and non-empty: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET_KEY`, `ORIGIN_SECRET`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` (`REQUIRED_IN_PRODUCTION` in `app/config/settings.py`). The error names the missing variables and never prints a value. Production sets nothing else: every other variable the app reads defaults to production's value, and Railway supplies the `PORT` the start command listens on.

`ORIGIN_SECRET` and `JWT_SECRET_KEY` are read directly from the environment (in `app/middleware/origin_check.py` and `app/core/auth.py`) rather than through `settings.py`. In production, uvicorn trusts no proxy headers: the Dockerfile's start command passes `--no-proxy-headers`, so the client's address comes only from `CF-Connecting-IP`.

A local `server/.env` sets every variable in the table except `ORIGIN_SECRET` and the optional ones, starting with `ENVIRONMENT=development`.

## API

Every API route is mounted under `/api`, and every one but `/api/health` has its own rate limit (`tests/test_rate_limit.py` pins each route's limit string).

| Route family | Purpose |
|---|---|
| `/api/health` | liveness check (also reports Redis connectivity) |
| `/api/levels` | a level's collectibles grouped by location |
| `/api/collectibles` | every collectible with its level and location, or the items of one type in the Collectibles category |
| `/api/upgrades`, `/api/cosmetics` | category-scoped collectible reads (four routers defined in `routers/collectibles.py`) |
| `/api/walkthroughs` | the walkthrough list, a category's walkthroughs, and one walkthrough by category and slug (a plural category's singular, such as `side-quest` for `side-quests`, gets a 308 to the canonical URL) |
| `/api/search` | one ranked search across collectibles, walkthroughs and their sections, and the type, walkthrough category, and level pages (stored, weighted `tsvector` columns and `pg_trgm` similarity in one statement, plus an edit-distance fallback for typos) |
| `/api/auth` | register / login / logout (one session or all), token refresh, OAuth (Google, Discord), password change and reset |
| `/api/users` | account settings (username, an avatar fetched from a submitted URL and moderated, account deletion), completion stats for the Progress page, and admin-only user administration |
| `/api/comments` | threaded comments with AI moderation and soft delete |
| `/api/progress` | per-user collectible completion (PUT to mark, DELETE to clear), guest-progress sync on login, and bulk clear or mark found for everything, a level, or a type, optionally narrowed to one cycle |
| `/api/notifications` | reply notifications |

In production the app also serves the built SPA (`app/seo_head.py`): unknown `/api/*` paths return a JSON 404 (a 405 for methods other than GET and HEAD), a file in `client/dist` is served as it is, and any other path gets `index.html` with that route's title, description, canonical, Open Graph, and Twitter card tags spliced into its head, so client-side routes work on direct navigation, and link previews and non-JS crawlers get real heads without SSR.

## Redis

Redis plays three roles:

1. **Response cache** (`app/core/cache.py`): serialized JSON responses keyed `<resource>:<params>` (for example `collectibles:level:eidos-7`), 30-day default TTL (an hour for search), cleared by pattern after each content deploy.
2. **Rate-limiter storage** (`app/core/security.py`): slowapi counters. Limiting is applied per route with decorators, not as a middleware layer.
3. **Session and sign-in state**: refresh tokens, SHA-256 hashed before storage, with one session-family key per sign-in (`app/core/auth.py`); single-use OAuth `state` records with a 10-minute TTL (`app/services/oauth_state.py`); and one-hour password-reset tokens with a 15-minute cooldown per address (`app/routers/auth.py`).

An outage degrades the service rather than breaking it:

- Every Redis call uses bounded 2-second socket timeouts, so a dead Redis cannot hang requests.
- The response cache fails open: cache errors are swallowed and reads fall through to PostgreSQL, just uncached.
- The rate limiter falls back to per-process in-memory counters and never raises into route handlers.
- Endpoints that cannot safely fail open (auth and session paths) fail closed: an unhandled `RedisError` is converted by the error-handler middleware into a `503` with `Retry-After: 30`.

`tests/test_redis_resilience.py` pins the limiter's fallback settings and the 503s.

## Auth

- **JWT access tokens**: short-lived, returned in the response body, and held in client memory only.
- **Rotating refresh tokens**: opaque tokens delivered as HttpOnly cookies, SHA-256 hashed before storage in Redis, and rotated on every refresh. Logout and password change revoke sessions.
- **OAuth** sign-in with Google and Discord. Each flow's `state` is bound to an HttpOnly cookie and to a single-use, provider-bound Redis record with a 10-minute TTL, and checked before any code exchange. A sign-in links to or creates an account only on a provider-verified email and never links into an account that has a password; the callback redirects into the SPA, and a refusal redirects to the login page with a fixed error code and never echoes the request.
- Passwords are hashed with argon2, and a new one takes 8 to 128 characters. Roles are `user`, `moderator`, and `admin`: the admin user routes require `admin` through a FastAPI dependency (`require_role`), and comment deletion checks for a moderator or admin in the route.

## Middleware

Starlette prepends middleware, so registration order in `app/main.py` is the reverse of execution order. The request-processing order below (outer to inner) is load-bearing and documented in the code:

1. `logging`: times every request, including rejected ones, and sets `X-Process-Time`.
2. `security_headers`: CSP, HSTS, nosniff, frame denial, and per-path Cache-Control policy.
3. `TrustedHost`: validates the Host header against `ALLOWED_HOSTS`.
4. `error_handler`: uniform JSON error responses; maps `RedisError` to 503 + Retry-After, and a request value the database refuses (most of SQLSTATE class 22) to a 400.
5. `GZip`: compresses responses of 1000 bytes or more.
6. `ETag`: conditional GET for JSON API responses (304 on `If-None-Match`).
7. `origin_check`: production requests must carry the shared origin-secret header, compared in constant time; Railway's health check on `/api/health` is the one exception.
8. `bot_filter`: answers with a 404 an API request whose Referer is off the site (`/api/health` and `/api/auth/` excepted) and, outside `/api/`, `/assets/`, `/.well-known/`, and a few listed files, a bot-signature path or any path over 512 characters or not shaped like a site route (matched in linear time).

Rate limiting is not a middleware layer: the slowapi limiter is attached to the app and applied per route with decorators.

## Seed data

All guide content is authored as JSON in `seed-data/`, its own private git repository (gitignored in this one), which carries a README with the full schemas. The conventions that matter:

- `collectibles/<level>/<location>.json` holds an array of collectibles, one file per location; walkthroughs are one JSON object per file under `walkthroughs/<category>/` (the two DLCs under `dlc/nier` and `dlc/nikke`). The loaders ignore folder names: a collectible's `level` and `location` fields place it, and a walkthrough's `mission_type` sets its category.
- Collectible IDs are append-only: new items take `max id + 1`, gaps are fine, and IDs are never renumbered, because user progress references them and a content deploy upserts by ID.
- Descriptions and walkthrough text support a `[[path#anchor|Link text]]` wikilink syntax, where the path is a site path without its leading slash and the anchor is optional (parsed client-side into prefetching links). `\n\n` separates paragraphs, and a block of two or more lines that each start with `- ` renders as a bulleted list.
- `cycle` (Base / NG+ / NG++ / DLC) and `quantity` describe availability; `subtype` categorizes Documents.
- Images are authored as `/assets/images/...` paths; the image pipeline uploads them to R2 and rewrites the JSON URLs in place (see `scripts/images/PIPELINE.md`).

## Content pipeline and deployment

New content goes through one command:

```bash
uv run python scripts/dev_workflow.py collectibles    # or walkthroughs
```

which pre-generates five WebP sizes of each content image from the full-resolution masters (640, 960, 1,200, and 1,600 px plus full size; the home hero has seven), uploads them to R2, rewrites the JSON URLs, and loads the content into the dev database (`scripts/images/PIPELINE.md` documents each step, the URL scheme, and the image-replacement procedure). To update the database without touching images:

```bash
uv run python scripts/db/seed_collectibles.py
uv run python scripts/db/seed_walkthroughs.py
```

Each content type is written in one transaction, so a run that stops before its COMMIT leaves the database as it was: entries are upserted by `id`, entries no longer present in the JSON are deleted, Redis must answer before the COMMIT, and the affected cache patterns are cleared after it. `scripts/prod_seed.py` runs the production content deploy: it reads its credentials from `server/.env` (`PROD_*` / `CLOUDFLARE_*`, see Environment Variables), checks that PostgreSQL and Redis answer through the SSH tunnels, requires a typed confirmation, checks every content file before anything is written, runs both content writers, and then purges from Cloudflare the API URLs that changed, widening to every API URL when it can't tell which did (never the whole zone); `scripts/content-seeding-runbook.md` walks through a deploy step by step. `scripts/generate_sitemap.py` regenerates `client/public/sitemap.xml` from the database, deriving each content page's `lastmod` from a content hash persisted in `scripts/sitemap-state.json` (gitignored).

Schema changes are one-off manual scripts written into `scripts/migrations/` as needed (there is no Alembic). Each runs with `uv run python scripts/migrations/<script>.py` alongside an update to the matching SQLAlchemy model; the directory is gitignored, so the repo holds the model change and never the script. The exception is the two stored generated `search_vector` columns, which sit outside the ORM because nothing writes them: their expressions live in `app/services/search_text.py`, and each column's comment holds a hash of its expression, so `seed_db.py` and the migration can spot a stale one and rebuild it.

Production runs from the repo's multi-stage Dockerfile: Node 22 builds the React app, then a Python 3.14 image runs uvicorn with two workers, serving the API and the built SPA from a single origin as a non-root user. Its start command passes `--no-proxy-headers`: nothing in the app reads the request scheme, and the client's address comes only from Cloudflare's `CF-Connecting-IP`; a custom start command set in Railway would replace it. The service's variables are exactly the production-required list under Environment Variables.

## Testing

```bash
uv run pytest
```

No live services are needed: an in-memory SQLite database (aiosqlite) and `fakeredis` stand in for PostgreSQL and Redis. Route tests mostly build a minimal FastAPI app that mounts only the router under test and drive it over HTTP (httpx `AsyncClient`); the other tests call helpers and scripts directly, and a few read the source or the Dockerfile to pin a contract. Rate limiting is disabled suite-wide by a fixture, and a test that checks a 429 turns it back on. Coverage spans the content, search, auth, comment, notification, progress, and account routes, the middleware, Redis outage resilience, slug generation, settings, the content pipeline scripts, and seed-data validity, which runs only where the private content repository is checked out at `seed-data/` (CI runs without it). The search statement is PostgreSQL-only, so `scripts/search_eval.py` and the end-to-end suite check it against a real database.
