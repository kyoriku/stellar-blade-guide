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


# The master file types, as generate_variants.py reads them.
IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp')


def local_image_paths(entry):
    """Every string in a seed entry, at any depth, that is still a local image
    path: the canonical /assets/images/... form, or a host path holding the
    marker, naming an image file. Dev serves these from the masters folder, but
    the production image leaves that folder out, so each one must become an R2
    URL (the URL swap in update_r2_urls.py) before a prod seed. The seeders'
    --check refuses them. Prose that only mentions the folder isn't a path."""
    found = []

    def walk(value):
        if isinstance(value, str):
            normalized = normalize_image_path(value)
            if (normalized.startswith('/assets/images/')
                    and normalized.lower().endswith(IMAGE_EXTENSIONS)):
                found.append(value)
        elif isinstance(value, dict):
            for item in value.values():
                walk(item)
        elif isinstance(value, list):
            for item in value:
                walk(item)

    walk(entry)
    return found
