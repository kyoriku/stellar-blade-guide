"""
The site's password rule, in one place. Every request model that takes a password
applies it, and client/src/utils/validatePassword.ts mirrors both maximums.

A new password (register, change, reset) stops at NEW_PASSWORD_MAX_LENGTH. A password
checked against a stored hash (login, the current password) stops at passlib's own limit
(passlib.utils.MAX_PASSWORD_SIZE), which every stored password passed when it was set,
so none is ever refused; past it, hashing and verifying raise a ValueError nothing
catches, which was a 500. Lengths count characters (code points), as passlib and len() do.
"""

PASSWORD_MIN_LENGTH = 8
NEW_PASSWORD_MAX_LENGTH = 128
CURRENT_PASSWORD_MAX_LENGTH = 4096


def password_problem(password: str, *, new: bool) -> str | None:
    """None when the password passes, otherwise the message the API shows (the 422
    detail, a client-visible contract). A new password must meet the minimum and the new
    maximum; one checked against a stored hash only needs to be one that could be stored."""
    if new and len(password) < PASSWORD_MIN_LENGTH:
        return f"Password must be at least {PASSWORD_MIN_LENGTH} characters"
    limit = NEW_PASSWORD_MAX_LENGTH if new else CURRENT_PASSWORD_MAX_LENGTH
    if len(password) > limit:
        return f"Password must be at most {limit} characters"
    try:
        password.encode("utf-8")
    except UnicodeEncodeError:
        # A lone surrogate (U+D800 to U+DFFF) arrives as a JSON escape and has no UTF-8
        # form, so argon2 can neither hash nor check it.
        return "Password contains a character that can't be used"
    return None
