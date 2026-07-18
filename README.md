# Stellar Blade Guide

An unofficial game guide for *Stellar Blade* covering walkthroughs (main story, side quests, bulletin board requests, and more) and 1000+ collectibles. Full-stack web application managing 2000+ images served as pre-generated WebP from Cloudflare R2.

**[Live Site](https://stellarbladeguide.com)** | **Tech Stack:** TypeScript, React, Python, FastAPI, PostgreSQL, Redis

**Key Features:** Progress tracking (guest + authenticated) • Walkthroughs • Full-text search • User authentication • OAuth (Google/Discord) • Threaded comments • AI content moderation • Redis caching • Cloudflare R2 image CDN • Image galleries • Responsive design

![Home Page](client/public/assets/screenshots/homepage.png)

<details>
<summary><b>Built With</b></summary>

### Frontend
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154.svg?style=for-the-badge&logo=react-query&logoColor=white)](https://tanstack.com/query/latest/docs/framework/react/installation)

### Backend
[![Python](https://img.shields.io/badge/Python-3776AB.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-267D36.svg?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Pydantic](https://img.shields.io/badge/Pydantic-00B6F1.svg?style=for-the-badge&logo=python&logoColor=white)](https://pydantic-docs.helpmanual.io/)

### Database
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

</details>

## Table of Contents
- [Technical Details](#technical-details)
- [Repository Layout](#repository-layout)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [License](#license--legal)

## Technical Details

**Frontend**
- React 19 with TypeScript
- TanStack Query for data fetching, caching, and prefetching on hover
- Tailwind CSS for styling
- Image lightbox with zoom capability
- Skeleton loaders and smooth loading states
- Responsive design with mobile navigation drawer
- Protected routes with auth guards
- Progress tracking with localStorage for guests and API persistence for authenticated users
- Optimistic UI updates with automatic rollback on failure

**Backend**
- FastAPI with fully async endpoints
- JWT authentication with short-lived access tokens (15 min) and rotating refresh tokens (7 days) stored as HttpOnly cookies
- OAuth 2.0 integration with Google and Discord
- Password reset flow via email (Resend)
- SQLAlchemy ORM with async support
- Pydantic for request/response validation
- Role-based access control (user, moderator, admin)
- Rate limiting (slowapi) and custom honeypot middleware for bot detection
- AI-powered comment moderation via OpenAI Moderation API
- Progress tracking with guest-to-authenticated sync on login
- Single-process production deployment: FastAPI serves the built React SPA as a catch-all, with no separate static server

**Database**
- PostgreSQL with relational schema
- Junction tables for many-to-many relationships
- Soft deletes for comments to preserve thread context
- Indexed queries for performance

**Performance & Caching**
- Server-measured p50 API response time of 16ms (p95: 59ms) across a 24-hour production sample of 1,000+ requests; cached content reads at p50 10ms with a >99% Redis hit rate
- Multi-tier caching: Redis (server-side, 30-day TTL) + ETag/304 responses + TanStack Query (client-side)
- Redis outages degrade gracefully: cached reads fail open to PostgreSQL, rate limiting falls back to in-memory counters, and auth endpoints fail closed with a 503 + Retry-After
- Cache-Control exclusions for mutable per-user data (progress tracking)
- Cloudflare R2 with edge caching for image delivery (pre-generated WebP variants, immutable cache headers)
- Every API response carries an X-Process-Time timing header

**Infrastructure**

Content images are pre-generated as static WebP variants (four srcSet widths plus a full-size original per image, no runtime transforms) and served from Cloudflare R2 behind `img.stellarbladeguide.com` with immutable one-year cache headers and zone edge caching. The image pipeline migrated from Cloudinary to R2 in six independently verifiable phases with zero downtime, and Cloudinary has since been decommissioned for content; it remains in place solely for user avatar uploads. Pipeline details live in `server/scripts/images/PIPELINE.md`.

**Auth & User System**
- Email/password registration and login
- OAuth sign-in with Google and Discord (avatar pulled from provider)
- Secure session management with refresh token rotation
- Account settings: username, avatar (uploaded to Cloudinary with AI moderation), password change, account deletion

**Comments**
- Threaded comments (one level of nesting) on walkthroughs, levels, and collectible pages
- Post, edit, and delete with ownership checks
- Moderator and admin controls
- AI moderation via OpenAI flags inappropriate content before it's saved
- Soft delete preserves thread context when a parent comment is removed

**Search**
- Full-text search across collectibles, walkthroughs, and levels
- PostgreSQL `pg_trgm` trigram similarity + `tsvector` FTS; scores merged and ranked
- Rate-limited to 30 req/min; results cached in Redis for 1 hour

## Repository Layout

```
client/            React SPA (see client/README.md)
server/            FastAPI backend (see server/README.md)
server/seed-data/  JSON source data for all guide content (untracked; conventions documented in server/README.md)
.devcontainer/     Docker Compose dev environment (app container + PostgreSQL + Redis)
Dockerfile         multi-stage production build (Node builds the SPA, Python serves it)
package.json       root scripts that orchestrate client + server
```

Each app documents its own structure, commands, and internals: [client/README.md](client/README.md) and [server/README.md](server/README.md).

## Screenshots
<details>
<summary><b>View More Screenshots</b></summary>

![Walkthrough Page](client/public/assets/screenshots/walkthrough.png)
![Level Page](client/public/assets/screenshots/level.png)
![Collectibles Page](client/public/assets/screenshots/collectibles.png)

</details>

## Installation

### Dev Container (recommended)

Requires [VS Code](https://code.visualstudio.com/), the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension, and [Docker](https://www.docker.com/products/docker-desktop/).

1. Clone the repository and open the folder in VS Code
2. Click **Reopen in Container** when prompted, or press `F1` → *Dev Containers: Reopen in Container*
3. Dependencies install automatically (`uv sync` + `npm install`)
4. Create `server/.env` (see **Environment Variables** below)
5. Start both servers:

```bash
npm run dev
```

Frontend: http://localhost:3000 · API: http://localhost:8000

PostgreSQL and Redis are provided by the container; no local installs needed.

### Environment Variables

Create `server/.env` before starting the servers. The full variable table (every variable with its purpose) lives in [server/README.md](server/README.md#environment-variables).

<details>
<summary>Manual setup (without Dev Container)</summary>

**Prerequisites:** Node.js 22+, Python 3.13+, PostgreSQL, Redis, [uv](https://github.com/astral-sh/uv)

```bash
cd client && npm install
cd server && uv sync
```

Create a PostgreSQL database, configure `server/.env` (see Environment Variables above), then run:

```bash
npm run dev
```

</details>

## License & Legal

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge&logo=mit)](https://opensource.org/licenses/MIT)

### Code License
This project is licensed under the [MIT License](LICENSE).

### Game Content
**Stellar Blade™** and all related content (screenshots, artwork, character names, locations, game mechanics) are © Shift Up Corporation and Sony Interactive Entertainment. This is an **unofficial fan-made guide** and is not affiliated with, endorsed by, or connected to the rights holders.

### Fair Use Statement
This project uses game content under fair use principles for educational, informational, and non-commercial purposes.