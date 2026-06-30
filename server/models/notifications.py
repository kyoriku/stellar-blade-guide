from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.sql import func

from db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    # Recipient — the person being notified.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # Who triggered it (the replier). SET NULL so a notification can outlive the
    # actor's account — read paths MUST tolerate a null actor.
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(50), nullable=False)  # 'comment_reply' (extensible)
    # The reply comment this notification points to (CASCADE: gone if the reply is hard-deleted).
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    content_type = Column(String(50), nullable=False)  # walkthrough, collectible, level
    content_id = Column(Integer, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_notifications_user_unread", "user_id", "is_read"),
        Index("idx_notifications_user_created", "user_id", "created_at"),
    )

    def __repr__(self):
        return f"<Notification id={self.id} user_id={self.user_id} type={self.type!r} is_read={self.is_read}>"
