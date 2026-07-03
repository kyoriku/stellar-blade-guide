# models/progress.py

from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from db.database import Base

class UserProgress(Base):
    __tablename__ = 'user_progress'

    id = Column(Integer, primary_key=True)
    # No standalone index on user_id: the uq_user_collectible composite (user_id
    # leading) already serves every user_id-filtered read + the user-delete cascade.
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    # Indexed: collectible_id has an ON DELETE CASCADE FK, and the composite cannot
    # serve a collectible_id-leading lookup, so the collectible-delete cascade would
    # otherwise sequentially scan this table.
    collectible_id = Column(Integer, ForeignKey('collectibles.id', ondelete='CASCADE'), nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'collectible_id', name='uq_user_collectible'),
    )