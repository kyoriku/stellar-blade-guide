from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from config.settings import settings

# Async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,          # Test connections before using them
    # pool_recycle=3600,           # Recycle connections after 1 hour (prevents stale connections)
    # pool_size=5,                 # Number of persistent connections
    # max_overflow=10,             # Additional connections when pool is full
    # pool_timeout=30,             # Timeout waiting for connection from pool
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base for models
Base = declarative_base()

# Dependency for routes
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session