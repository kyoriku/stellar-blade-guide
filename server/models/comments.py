from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    content_type = Column(String(50), nullable=False)   # walkthrough, collectible, level
    content_id = Column(Integer, nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    body = Column(Text, nullable=False)
    is_approved = Column(Boolean, nullable=False, default=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_comments_content", "content_type", "content_id"),
    )

    # Relationships
    user = relationship("User", back_populates="comments")
    replies = relationship(
    "Comment",
    foreign_keys="Comment.parent_id",
    primaryjoin="Comment.id == foreign(Comment.parent_id)",
    lazy="select",
)

    def __repr__(self):
        return f"<Comment id={self.id} content_type={self.content_type!r} content_id={self.content_id}>"