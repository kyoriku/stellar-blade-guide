"""
The site's username rule, in one place, and the only way a provider's display name
becomes a username.

Registration and Settings validate what a person typed. A provider login has nobody to
ask, so the name is cleaned into the rule instead, and then checked with the rule: the
cleaner is never trusted on its own.
"""
import re
import secrets
import unicodedata

USERNAME_MIN = 3
USERNAME_MAX = 50
# Generated names stop short of the maximum so the uniqueness suffix always fits.
GENERATED_BASE_MAX = 45


def username_problem(name: str) -> str | None:
    """None when `name` satisfies the rule, otherwise the message the API shows. Both
    messages are a client-visible contract: they are the 422 detail."""
    if len(name) < USERNAME_MIN or len(name) > USERNAME_MAX:
        return "Username must be between 3 and 50 characters"
    # str.isalnum() accepts any Unicode letter or digit, so "José" and "你好" are valid.
    # client/src/utils/validateUsername.ts mirrors this with \p{L}\p{N}.
    if not name.replace("_", "").replace("-", "").isalnum():
        return "Username may only contain letters, numbers, hyphens, and underscores"
    return None


def _generated() -> str:
    return f"user_{secrets.token_hex(3)}"


def username_from_provider(raw: str | None) -> str:
    """A username that satisfies the rule, from whatever a provider called the person.

    Never derived from the email: a username is public, and the email is shown to
    nobody but its owner.
    """
    # NFKC first. It composes accents, so an "e" plus a combining mark becomes a letter
    # isalnum() accepts, and it folds full-width and mathematical letters to plain ones,
    # so a styled copy of an existing name collides with it instead of sitting beside it.
    name = unicodedata.normalize("NFKC", raw or "")
    # Everything the rule forbids becomes a separator rather than vanishing, so
    # "john.doe" stays readable. That includes the invisible and direction-control
    # characters that would otherwise make one name render exactly like another.
    name = "".join(ch if (ch.isalnum() or ch == "-") else "_" for ch in name)
    name = re.sub(r"_+", "_", name).strip("_-")
    name = name[:GENERATED_BASE_MAX].rstrip("_-")

    if not any(ch.isalnum() for ch in name):
        return _generated()
    if len(name) < USERNAME_MIN:
        # A real two-character name ("李雷") keeps its characters.
        name = f"{name}_{secrets.token_hex(3)}"
    # The rule has the last word, not the cleaning above.
    return name if username_problem(name) is None else _generated()
