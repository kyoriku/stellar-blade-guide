"""Shared path normalization for image references in seed data.

Copy-paste authoring contract: an authored image reference may be an absolute
host path from any machine (/Users/... on macOS, /workspaces/... in the
devcontainer) as long as it contains the literal marker segment
client/public/assets/images/. Every reader normalizes such values to the
canonical /assets/images/... form; canonical paths, R2 URLs, and anything
without the marker pass through unchanged. Seed files themselves are only
rewritten by update_r2_urls.py (absolute -> R2 URL on swap), never by the
normalizer directly.
"""

MARKER = 'client/public/assets/images/'


def normalize_image_path(value):
    """Normalize one image reference; non-strings and marker-less values
    pass through unchanged."""
    if isinstance(value, str) and MARKER in value:
        return '/assets/images/' + value.split(MARKER, 1)[1]
    return value


def normalize_content_images(content):
    """Normalize image URLs inside a walkthrough content array (in place).
    Only images[].url values are touched; all other strings are left alone."""
    for block in content or []:
        for img in block.get('images') or []:
            if 'url' in img:
                img['url'] = normalize_image_path(img['url'])
    return content
