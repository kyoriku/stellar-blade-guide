# models/progress.py

from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from db.database import Base

class UserProgress(Base):
    __tablename__ = 'user_progress'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    collectible_id = Column(Integer, ForeignKey('collectibles.id', ondelete='CASCADE'), nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'collectible_id', name='uq_user_collectible'),
    )