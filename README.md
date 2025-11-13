# Stellar Blade Guide

- **Frontend**: TypeScript, React, Tailwind CSS, TanStack Query
- **Backend**: Python, FastAPI, SQLAlchemy, Pydantic
- **Database**: PostgreSQL, Redis

## Built With

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

### Database & Caching
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

### Hosting
[![Railway](https://img.shields.io/badge/Railway-000000.svg?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)

---

## Project Highlights
- **Full-Stack Ownership:** Developed end-to-end, from database schema design to backend API and React frontend.  
- **Async & Scalable:** FastAPI async endpoints and Redis caching reduce API response times and handle high concurrency.  
- **Client & Server Performance Optimizations:** Implemented TanStack Query caching with prefetching, giving near-instant page loads without loading spinners.  
- **Data Validation & Reliability:** Pydantic models ensure strict schema validation, preventing runtime errors and improving API reliability.  
- **Database Design:** PostgreSQL schemas optimized for query performance; Redis caches frequently-accessed data.  
- **User Experience Focused:** Prefetching and caching strategies improve perceived performance and navigation responsiveness.  
- **Reliable Deployment:** Hosted on Railway with automated builds on push and pull request workflows.

# client/ directory:

# server/ directory:

## Local Database Setup

Choose either method:

### Method 1: Simple
```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE stellarblade;

# Exit
\q
```

### Method 2: SQL File

Create `db/schema.sql`:
```sql
DROP DATABASE IF EXISTS stellarblade;
CREATE DATABASE stellarblade;
```

Then run:
```bash
psql -d postgres -f db/schema.sql
```

## Seed Database

After creating the database, run these scripts in order:

### 1. Seed Base Data (Levels, Locations, Types)
```bash
python3 scripts/db/seed_db.py
```

Output:
```
Tables created/verified
Database seeded successfully
```

### 2. Seed Collectibles (from JSON files)
```bash
python3 scripts/db/seed_collectibles.py
```

Output:
```
Starting database seed...
Found 63 JSON files
...
Seeding complete!
Added: 768
```

### 3. Seed Walkthroughs
```bash
python3 scripts/db/seed_walkthroughs.py
```

Output:
```
Seeding walkthroughs...
Clearing Redis cache...

Redis cache cleared
Walkthrough seeded successfully
```

## Start Server
```bash
uvicorn main:app --reload
```











# server/ directory:

## Environment Setup

Make sure you’re inside the `server/` directory.

### 1. Create and Activate Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file in the `server/` directory and add the following:

```bash
# Database configuration
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/stellarblade

# Redis configuration
REDIS_URL=redis://localhost:6379

# Cloudinary configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cache configuration (in seconds)
CACHE_TTL_SHORT=600
CACHE_TTL_MEDIUM=1800
CACHE_TTL_LONG=7200

# Admin secret key
ADMIN_SECRET=your_admin_secret
```

## Local Database Setup

Choose either method:

### Method 1: CLI

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE stellarblade;

# Exit
\q
```

### Method 2: SQL File

Create `db/schema.sql`:

```sql
DROP DATABASE IF EXISTS stellarblade;
CREATE DATABASE stellarblade;
```

Then run:

```bash
psql -d postgres -f db/schema.sql
```

## Seed Database

After creating the database, run these scripts in order:

### 1. Seed Base Data (Levels, Locations, Types)

```bash
python3 scripts/db/seed_db.py
```

Output:

```
Tables created/verified
Database seeded successfully
```

### 2. Seed Collectibles (from JSON files)

```bash
python3 scripts/db/seed_collectibles.py
```

Output:

```
Starting database seed...
Found 63 JSON files
...
Seeding complete!
Added: 768
```

### 3. Seed Walkthroughs

```bash
python3 scripts/db/seed_walkthroughs.py
```

Output:

```
Seeding walkthroughs...
Clearing Redis cache...

Redis cache cleared
Walkthrough seeded successfully
```


Good catch — yeah, you never want to publish real `.env` values (especially Cloudinary keys or admin secrets). Here’s a **safe, public-ready version** you can use in your README:


## Start Server

```bash
uvicorn main:app --reload
```

> **Note:**
> Each time you open a new terminal session, make sure to reactivate your virtual environment before starting the server:
>
> ```bash
> source venv/bin/activate
> ```




# server/ directory

Make sure you’re in the `server/` directory.


## 1. Virtual Environment & Dependencies

```bash
# Create and activate venv
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```


## 2. Environment Variables

Create a `.env` file in `server/`:

```bash
DATABASE_URL=DATABASE_URL=postgresql://localhost:5432/stellarblade
REDIS_URL=redis://localhost:6379

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CACHE_TTL_SHORT=600
CACHE_TTL_MEDIUM=1800
CACHE_TTL_LONG=7200

ADMIN_SECRET=your_admin_secret
```

> Make sure the database name here matches what you’ll create next.


## 3. Local Database

### Option 1: CLI

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE stellarblade;

# Exit
\q
```

### Option 2: SQL File

Create `db/schema.sql`:

```sql
DROP DATABASE IF EXISTS stellarblade;
CREATE DATABASE stellarblade;
```

Then run:

```bash
psql -d postgres -f db/schema.sql
```

> Either method works; just pick one. Make sure the DB name matches with `DATABASE_URL`.

## 4. Seed Database

Run scripts in order:

```bash
python3 scripts/db/seed_db.py
python3 scripts/db/seed_collectibles.py
python3 scripts/db/seed_walkthroughs.py
```

## 5. Start Server

```bash
uvicorn main:app --reload
```

> Every new terminal session, reactivate the venv first:
>
> ```bash
> source venv/bin/activate
> ```


