from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config.settings import settings

# Async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    connect_args={
        "command_timeout": 10,
        "server_settings": {
            "statement_timeout": "10000",
        },
    },
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base for models
Base = declarative_base()

# LIKE/ILIKE patterns built from request input must escape the wildcard characters:
# an unescaped `%` or `_` in a URL slug turns a lookup into a wildcard scan, and a
# scalar_one_or_none() on the result then raises MultipleResultsFound -> 500. Pair
# every escape_like() call with .ilike(pattern, escape=LIKE_ESCAPE).
LIKE_ESCAPE = "\\"


def escape_like(value: str) -> str:
    """Escape %, _ and the escape character so `value` matches literally inside a
    LIKE/ILIKE pattern compiled with escape=LIKE_ESCAPE."""
    return (
        value.replace(LIKE_ESCAPE, LIKE_ESCAPE + LIKE_ESCAPE)
        .replace("%", LIKE_ESCAPE + "%")
        .replace("_", LIKE_ESCAPE + "_")
    )

# Dependency for routes
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session