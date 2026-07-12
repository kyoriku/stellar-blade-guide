# Stellar Blade Guide - server

The FastAPI backend for [Stellar Blade Guide](../README.md). It serves all guide content (collectibles, walkthroughs, levels), full-text search, accounts and progress tracking, threaded comments with AI moderation, and (in production) the built React SPA. See the root README for the project overview and dev-container setup.

## Stack

- **Python 3.13** + **FastAPI** (fully async)
- **SQLAlchemy 2.0** (async, `asyncpg` driver) + **Pydantic v2**
- **PostgreSQL** (content, users, progress, comments) + **Redis** (cache, rate limiting, sessions)
- **PyJWT** + **passlib/argon2** for auth
- **Cloudflare R2** (content image hosting), **Cloudinary** (user avatars; migration rollback), **OpenAI Moderation API** (comments and avatars), **Resend** (email)
- Managed with [uv](https://docs.astral.sh/uv/); tested with **pytest**

## Layout

```
app/
  main.py            FastAPI app: middleware stack, router mounting, SPA fallback
  config/
    settings.py      env-sourced settings (see Environment Variables)
  core/
    auth.py          JWT create/decode, refresh-token helpers, get_current_user / require_role deps
    cache.py         Redis client + response-cache helpers (get / set / invalidate by pattern)
    security.py      client-IP resolution + slowapi rate limiter (Redis storage, in-memory fallback)
    logging.py       logging setup
    colours.py       ANSI colour constants for terminal output
  db/
    database.py      async engine + session factory (bounded query timeouts), get_db() dependency
  models/            SQLAlchemy ORM: collectibles, walkthroughs, users, progress, comments, notifications
  routers/           thin route handlers: routes + cache orchestration per resource
  schemas/           Pydantic request/response models
  services/          business logic: auth, collectibles, comments, search, users
  middleware/        request-pipeline layers (see Middleware) + rate-limiter and exception-handler setup
scripts/
  dev_workflow.py    one-command content pipeline (compress, generate variants, upload, update URLs, seed)
  db/                seed and export scripts (seed_collectibles.py, seed_walkthroughs.py, ...)
  images/            R2 image pipeline (generate_variants.py, upload_r2.py, update_r2_urls.py; full flow
                     documented in images/PIPELINE.md; legacy Cloudinary scripts retained until decommission)
  migrations/        manual, one-off schema migration scripts (no Alembic)
seed-data/           JSON source of truth for all content (untracked; carries its own README)
tests/               pytest suite (18 modules + conftest.py)
pyproject.toml       dependencies + pytest config
```

## Running

Everything runs from the `server/` directory with `uv`, or from the repo root via the `npm run` wrappers (see the root README).

```bash
uv sync                                    # install dependencies
uv run uvicorn app.main:app --reload       # dev server on :8000
```

`DATABASE_URL` must point at a PostgreSQL instance and `REDIS_URL` at a Redis instance; the dev container provides and wires both automatically. Interactive API docs at `http://localhost:8000/docs` are available only when `DEBUG=True` (disabled in production). The `pg_trgm` extension and FTS indexes that search needs are created by `scripts/db/seed_db.py` (also available standalone as `scripts/migrations/add_search_indexes.py`).

## Environment Variables

Configuration is read from `server/.env` (gitignored). Secrets should be generated fresh per environment (`openssl rand -hex 32` works for the two signing/shared secrets).

| Variable | Purpose |
|---|---|
| `ENVIRONMENT` | `development` or `production`; production enables secure cookies and the origin check |
| `DEBUG` | `True` enables `/docs` and relaxes origin/bot checks for local development |
| `DATABASE_URL` | PostgreSQL DSN; `postgresql://` or `postgresql+asyncpg://` (normalized automatically) |
| `REDIS_URL` | Redis instance used for the cache, rate limiter, and sessions |
| `CACHE_TTL` | response-cache TTL in seconds (defaults to 30 days; dev setups often use a shorter value) |
| `ALLOWED_HOSTS` | comma-separated Host-header allowlist for TrustedHost validation |
| `JWT_SECRET_KEY` | signing key for access tokens; required at startup |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | access-token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | refresh-token lifetime |
| `FRONTEND_URL` | base URL used in OAuth redirects and password-reset emails |
| `OPENAI_API_KEY` | comment and avatar moderation (moderation fails open if unreachable) |
| `RESEND_API_KEY` | transactional email (password reset) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account (user avatars and legacy migration scripts only) |
| `CLOUDINARY_API_KEY` | Cloudinary API key (avatars/legacy only) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (avatars/legacy only) |
| `R2_ACCOUNT_ID` | Cloudflare account id for the R2 S3 endpoint (image pipeline scripts only) |
| `R2_ACCESS_KEY_ID` | R2 API token access key (image pipeline scripts only) |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret (image pipeline scripts only) |
| `R2_BUCKET` | R2 bucket holding content images |
| `R2_PUBLIC_BASE_URL` | public base URL images are served from (`https://img.stellarbladeguide.com`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL |
| `DISCORD_CLIENT_ID` | Discord OAuth client id |
| `DISCORD_CLIENT_SECRET` | Discord OAuth client secret |
| `DISCORD_REDIRECT_URI` | Discord OAuth callback URL |
| `ORIGIN_SECRET` | shared secret required on API requests in production (origin check middleware) |
| `LOG_LEVEL` | logging level (default `INFO`) |

`ORIGIN_SECRET` is read directly from the environment rather than through `settings.py`.

Starter template for `server/.env` (the table above explains each value):

```bash
ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=INFO

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/stellarblade
REDIS_URL=redis://localhost:6379
CACHE_TTL=2592000                # 30-day default; dev setups often use a shorter value
ALLOWED_HOSTS=localhost,127.0.0.1

JWT_SECRET_KEY=                  # openssl rand -hex 32
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:3000
ORIGIN_SECRET=                   # openssl rand -hex 32

OPENAI_API_KEY=your_openai_api_key
RESEND_API_KEY=your_resend_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name    # avatars/legacy scripts only
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET=your_r2_bucket_name
R2_PUBLIC_BASE_URL=https://img.stellarbladeguide.com

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:8000/api/auth/discord/callback
```

## API

All routes are mounted under `/api` and rate limited per route.

| Route family | Purpose |
|---|---|
| `/api/health` | liveness check (also reports Redis connectivity) |
| `/api/levels` | game levels, their locations, and the collectibles within each |
| `/api/collectibles` | collectibles by type |
| `/api/upgrades`, `/api/cosmetics`, `/api/materials` | category-scoped collectible reads (five routers defined in `routers/collectibles.py`) |
| `/api/types` | all collectible types |
| `/api/walkthroughs` | walkthroughs by mission type and slug |
| `/api/search` | full-text search across collectibles, walkthroughs, and levels (`pg_trgm` + `tsvector`, scores merged) |
| `/api/auth` | register / login / logout, token refresh, OAuth (Google, Discord), password reset |
| `/api/users` | account settings (profile, avatar upload with moderation) and role-gated user administration |
| `/api/comments` | threaded comments with AI moderation and soft delete |
| `/api/progress` | per-user collectible completion + guest-progress sync on login |
| `/api/notifications` | reply notifications |

In production the app also serves the built SPA: unknown `/api/*` paths return a JSON 404, while any other path serves the file from `client/dist` or falls back to `index.html` so client-side routes work on direct navigation.

## Redis

Redis plays three roles:

1. **Response cache** (`app/core/cache.py`): serialized JSON responses keyed `<resource>:<params>` (for example `collectibles:level:eidos-7`), 30-day default TTL, invalidated by pattern when content is re-seeded.
2. **Rate-limiter storage** (`app/core/security.py`): slowapi counters. Limiting is applied per route with decorators, not as a middleware layer.
3. **Session store** (`app/core/auth.py`): refresh tokens (SHA-256 hashed before storage) and short-lived password-reset tokens.

An outage degrades the service rather than breaking it:

- Every Redis call uses bounded 2-second socket timeouts, so a dead Redis cannot hang requests.
- The response cache fails open: cache errors are swallowed and reads fall through to PostgreSQL, just uncached.
- The rate limiter falls back to per-process in-memory counters and never raises into route handlers.
- Endpoints that cannot safely fail open (auth and session paths) fail closed: an unhandled `RedisError` is converted by the error-handler middleware into a `503` with `Retry-After: 30`.

This behavior is pinned by `tests/test_redis_resilience.py`.

## Auth

- **JWT access tokens**, short-lived, returned in the response body and held in client memory only.
- **Rotating refresh tokens**: opaque tokens delivered as HttpOnly cookies, SHA-256 hashed before storage in Redis, and rotated on every refresh. Logout and password change revoke sessions.
- **OAuth** sign-in with Google and Discord; provider accounts are linked to local users, and the callback redirects into the SPA.
- **Password reset** by email via Resend; the request endpoint always returns 204 so it cannot be used to enumerate accounts.
- Passwords are hashed with argon2. Role-based access control (`user`, `moderator`, `admin`) is enforced through FastAPI dependencies.

## Middleware

Starlette prepends middleware, so registration order in `app/main.py` is the reverse of execution order. The request-processing order below (outer to inner) is load-bearing and documented in the code:

1. `logging`: times every request, including rejected ones, and sets `X-Process-Time`.
2. `security_headers`: CSP, HSTS, nosniff, frame denial, and per-path Cache-Control policy.
3. `TrustedHost`: validates the Host header against `ALLOWED_HOSTS`.
4. `error_handler`: uniform JSON error responses; maps `RedisError` to 503 + Retry-After.
5. `GZip`: compresses responses of 1000 bytes or more.
6. `ETag`: conditional GET for JSON API responses (304 on `If-None-Match`).
7. `origin_check`: production requests must carry the shared origin-secret header.
8. `bot_filter`: rejects bot-signature paths and off-domain API referers with 404s.

Rate limiting is not a middleware layer: the slowapi limiter is attached to the app and applied per route with decorators.

## Seed data

All guide content is authored as JSON in `seed-data/` (untracked in this repo; the directory carries its own README with the full schemas). The conventions that matter:

- `collectibles/<level>/<location>.json` holds an array of collectibles, one file per location; walkthroughs are one JSON object per file under `walkthroughs/<mission-type>/`.
- Collectible IDs are append-only: new items take `max id + 1`, gaps are fine, and IDs are never renumbered, because user progress references them and seeding upserts by ID.
- Descriptions support a `[[category/type#anchor|Link text]]` wikilink syntax (parsed client-side into prefetching links) and `\n\n` paragraph breaks.
- `cycle` (Base / NG+ / NG++ / DLC) and `quantity` describe availability; `subtype` categorizes Documents.
- Images are authored as `/assets/images/...` paths; the image pipeline uploads them to R2 and rewrites the JSON URLs in place (see `scripts/images/PIPELINE.md`).

## Seeding and deployment

New content goes through one command:

```bash
uv run python scripts/dev_workflow.py collectibles    # or walkthroughs
```

which compresses source images to 1080p, pre-generates the WebP variants, uploads them to R2, rewrites the JSON URLs, and seeds PostgreSQL (`scripts/images/PIPELINE.md` documents each step, the URL scheme, and the image-replacement and rollback procedures). To re-seed without touching images:

```bash
uv run python scripts/db/seed_collectibles.py
uv run python scripts/db/seed_walkthroughs.py
```

Seeding upserts by `id`, deletes rows no longer present in the JSON, and invalidates the affected Redis cache patterns. `scripts/prod_seed.py` (production seeding) is gitignored by design. `scripts/generate_sitemap.py` regenerates `client/public/sitemap.xml` from the live API.

Schema changes are manual scripts in `scripts/migrations/` (there is no Alembic). Run them individually with `uv run python scripts/migrations/<script>.py` and update the matching SQLAlchemy model.

Production runs from the repo's multi-stage Dockerfile: Node 22 builds the React app, then a Python 3.13 image serves the API and the built SPA from a single origin as a non-root user.

## Testing

```bash
uv run pytest
```

261 tests run in about two and a half seconds. The suite is black-box contract style: each test builds a minimal FastAPI app and drives it over HTTP (httpx `AsyncClient`), with an in-memory SQLite database (aiosqlite) and `fakeredis` standing in for PostgreSQL and Redis, so no live services are needed. Rate limiting is disabled suite-wide by a fixture. Coverage spans the content routes and schemas, auth flows, ETag / bot-filter / origin-check middleware, Redis outage resilience, slug generation, and seed-data validity.
