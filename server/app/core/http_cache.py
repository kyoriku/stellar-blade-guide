"""Shared HTTP conditional-request helpers.

Lives in core/ rather than beside either caller because both the API ETag
middleware and the SPA shell need it, and the middleware must not import from
seo_head: that would invert the layering and drag settings, the cache and the
walkthroughs router into a middleware module.
"""


def etag_matches(if_none_match: str, etag: str) -> bool:
    """Weak comparison of an If-None-Match header against one ETag, per
    RFC 9110 §8.8.3.2 / §13.1.2.

    Three things a plain `==` gets wrong, all of which mean a client that
    already holds the current body is sent the whole thing again:

    - `W/"abc"` never equals `"abc"`. Intermediaries may weaken a validator
      when they transform a representation, and the weak form is what comes
      back on the next revalidation.
    - `If-None-Match` is a list. A client holding several validators for a URL
      sends `"a", "b"`, which matches neither entry as a whole string.
    - `*` matches any existing representation and is how a client asks
      "anything you have".

    Weak comparison is the correct rule for If-None-Match specifically: the
    spec reserves strong comparison for Range requests, where byte offsets have
    to refer to the identical representation. For a 304 it is enough that the
    representations are semantically equivalent.
    """
    if if_none_match.strip() == '*':
        return True
    for candidate in if_none_match.split(','):
        candidate = candidate.strip()
        if candidate.startswith('W/'):
            candidate = candidate[2:]
        if candidate == etag:
            return True
    return False
