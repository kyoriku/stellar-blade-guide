# Stellar Blade Guide

A game guide and collectibles tracker for *Stellar Blade*. Full-stack web application managing 800+ database records, and 1000+ images via Cloudinary CDN.

**[Live Site](https://stellarbladeguide.com)** | **Tech Stack:** TypeScript, React, Python, FastAPI, PostgreSQL, Redis

**Key Features:** Multi-tier Redis caching • Cloudinary CDN • Image galleries • Responsive design • Junction table queries

![Home Page](client/public/images/homepage.png)

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
- [Screenshots](#screenshots)
- [Installation](#installation)
- [License](#license--legal)

## Technical Details

**Frontend**
- React with TypeScript
- TanStack Query for data fetching and caching with prefetching
- Tailwind CSS for styling
- Image lightbox with zoom capability
- Responsive design

**Backend**
- FastAPI with async endpoints
- SQLAlchemy ORM with async support
- Pydantic for request/response validation
- Rate limiting (100 requests/minute)
- CORS configuration

**Database**
- PostgreSQL with relational schema
- Junction tables for many-to-many relationships
- Indexed queries for performance

**Performance & Caching**
- Multi-tier Redis caching (10min/30min/60min TTLs)
- Cloudinary CDN for image delivery
- TanStack Query client-side caching

**Features**
- Browse 800+ collectibles by level and location
- Filter by collectible type
- Mission walkthroughs with objectives
- Image galleries with 1000+ images

## Screenshots
<details>
<summary><b>View More Screenshots</b></summary>

![Walkthrough Page](client/public/images/walkthrough.png)
![Level Page](client/public/images/level.png)
![Collectibles Page](client/public/images/collectibles.png)

</details>

## Installation

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Redis 7+

### Backend Setup

Navigate to the `server/` directory.

#### 1. Virtual Environment & Dependencies
```bash
# Create and activate venv
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 2. Environment Variables

Create a `.env` file in `server/`:
```bash
DATABASE_URL=postgresql://localhost:5432/stellarblade
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CACHE_TTL_SHORT=600
CACHE_TTL_MEDIUM=1800
CACHE_TTL_LONG=7200

ADMIN_SECRET=your_admin_secret
```

#### 3. Local Database

**Option 1: CLI**
```bash
psql postgres
CREATE DATABASE stellarblade;
\q
```

**Option 2: SQL File**

Create `db/schema.sql`:
```sql
DROP DATABASE IF EXISTS stellarblade;
CREATE DATABASE stellarblade;
```

Then run:
```bash
psql -d postgres -f db/schema.sql
```

#### 4. Seed Database
```bash
python3 scripts/db/seed_db.py
python3 scripts/db/seed_collectibles.py
python3 scripts/db/seed_walkthroughs.py
```

#### 5. Start Server
```bash
uvicorn main:app --reload
```

> **Note:** Reactivate venv in new terminal sessions:
> ```bash
> source venv/bin/activate
> ```

### Frontend Setup

Navigate to the `client/` directory:
```bash
npm install
npm run dev
```

## License & Legal

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge&logo=mit)](https://opensource.org/licenses/MIT)

### Code License
This project is licensed under the [MIT License](LICENSE).

### Game Content
**Stellar Blade™** and all related content (screenshots, artwork, character names, locations, game mechanics) are © Shift Up Corporation and Sony Interactive Entertainment. This is an **unofficial fan-made guide** and is not affiliated with, endorsed by, or connected to the rights holders.

### Fair Use Statement
This project uses game content under fair use principles for educational, informational, and non-commercial purposes.