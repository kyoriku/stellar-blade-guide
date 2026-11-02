"""The site's roles by rank, and what rank allows with comments. client/src/utils/roles.ts
mirrors the map and the fallback, and tests/test_comment_rank.py keeps the two equal."""

USER_RANK = 1
# A role outside these (typed by hand in SQL) ranks as a user, actor and author alike.
ROLE_RANK = {"user": USER_RANK, "moderator": 2, "admin": 3}


def role_rank(role: str | None) -> int:
    return ROLE_RANK.get(role or "", USER_RANK)


def can_delete_comment(actor_id: int, actor_role: str | None, author_id: int | None, author_role: str | None) -> bool:
    """Your own comment, or one whose author's role ranks below yours. A comment with no
    author (its account deleted before deletion erased comments) counts as a user's."""
    if author_id is not None and author_id == actor_id:
        return True
    return role_rank(author_role) < role_rank(actor_role)
