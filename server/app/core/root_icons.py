"""The icons browsers and apps ask for by name at the site's root, whatever the page links.

Browsers, Apple devices, and some apps ask for /favicon.ico, /apple-touch-icon.png, and
/apple-touch-icon-precomposed.png (files in client/public), and for a sized name, square and
optionally precomposed (/apple-touch-icon-152x152.png, /apple-touch-icon-152x152-precomposed.png),
which gets the 180 px touch icon. One rule for the bot filter, security_headers, and seo_head, so
the three agree; it lives in core because middleware must not import seo_head.
"""
import re

# The file every sized name gets: the 180 x 180 touch icon.
TOUCH_ICON = 'apple-touch-icon.png'

# [0-9], not \d, which takes any script's digits. A size is 10 to 999, the same twice.
_ROOT_ICON = re.compile(
    r'/(?P<file>favicon\.ico|apple-touch-icon(?:-precomposed)?\.png)'
    r'|/apple-touch-icon-(?P<size>[1-9][0-9]{1,2})x(?P=size)(?:-precomposed)?\.png'
)


def root_icon_file(path: str) -> str | None:
    """The build's file for an icon asked for at the root, or None for any other path. Takes the
    path as routed (scope["path"]): exact and case-sensitive, so a decoded ? or # never cuts it short."""
    match = _ROOT_ICON.fullmatch(path)
    if match is None:
        return None
    return match['file'] or TOUCH_ICON
