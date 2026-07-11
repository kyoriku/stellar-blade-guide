import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import shutil
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
from PIL import Image

# Pre-generates every WebP file R2 serves. Layout in r2-staging/ mirrors R2 keys
# exactly: {key}.webp (full size, lightbox/stored URL) + {key}-w{N}.webp variants.
# Keys reuse upload_cloudinary.py's public_id derivation so R2 paths match the
# existing Cloudinary paths and r2-url-mapping.json can be joined on them.

STANDARD_WIDTHS = [640, 960, 1200, 1600]
HERO_WIDTHS = [640, 960, 1200, 1600, 1920, 2560]
WEBP_QUALITY = 80
WEBP_METHOD = 6
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

BASE_IMAGES_DIR = Path(__file__).parent.parent.parent.parent / 'client' / 'public' / 'assets' / 'images'
STAGING_DIR = Path(__file__).parent.parent.parent.parent / 'r2-staging'
MAPPING_FILE = Path(__file__).parent / 'url-mapping.json'

# Site/ assets are full-resolution one-offs keyed under stellar-blade/site/.
# og-banner.webp is a finished 1200x630 social card: copied verbatim, no variants.
SITE_DIR_NAME = 'Site'
SITE_COPY_AS_IS = {'og-banner.webp'}
SITE_HERO_STEM = 'home-hero'


def derive_key(rel_path_clean):
    """Mirror upload_cloudinary.py public_id derivation exactly."""
    folder_path = rel_path_clean.parent.as_posix().replace('_', '-').replace(' ', '-').lower()
    filename = rel_path_clean.stem.replace('_', '-').replace(' ', '-').replace('&', 'and').lower()
    if rel_path_clean.parts[0] == 'Walkthroughs':
        return f"stellar-blade/{folder_path}/{filename}"
    return f"stellar-blade/collectibles/{folder_path}/{filename}"


def plan_outputs(key, widths):
    """Output paths for one source image: full-size + width variants."""
    outputs = [(STAGING_DIR / f"{key}.webp", None)]
    for w in widths:
        outputs.append((STAGING_DIR / f"{key}-w{w}.webp", w))
    return outputs


def process_image(src, key, widths):
    """Encode full-size + variants for one source. Runs in a worker process."""
    created, skipped = 0, 0
    outputs = [(dest, w) for dest, w in plan_outputs(key, widths) if not dest.exists()]
    skipped = len(plan_outputs(key, widths)) - len(outputs)
    if not outputs:
        return created, skipped, None
    try:
        img = Image.open(src)
        if img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGB')
        for dest, w in outputs:
            dest.parent.mkdir(parents=True, exist_ok=True)
            if w is None or img.width <= w:
                # Full-size, or cap-at-original: narrower sources are encoded
                # full-size under the -wN name so no srcSet candidate can 404.
                out = img
            else:
                out = img.resize((w, round(img.height * w / img.width)), Image.Resampling.LANCZOS)
            out.save(dest, 'WEBP', quality=WEBP_QUALITY, method=WEBP_METHOD)
            created += 1
        return created, skipped, None
    except Exception as e:
        return created, skipped, f"{src}: {e}"


def collect_sources():
    """(src_path, key, widths, mapping_key) for every image to stage."""
    sources = []
    for ext in IMAGE_EXTENSIONS:
        for src in BASE_IMAGES_DIR.rglob(f"*{ext}"):
            if '_1080p' not in str(src):
                continue
            rel_path_clean = Path(str(src.relative_to(BASE_IMAGES_DIR)).replace('_1080p', ''))
            key = derive_key(rel_path_clean)
            mapping_key = f"/assets/images/{rel_path_clean.as_posix()}"
            sources.append((src, key, STANDARD_WIDTHS, mapping_key))

    site_dir = BASE_IMAGES_DIR / SITE_DIR_NAME
    if site_dir.exists():
        for src in sorted(site_dir.iterdir()):
            if not src.is_file() or src.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            if src.name in SITE_COPY_AS_IS:
                continue
            widths = HERO_WIDTHS if src.stem == SITE_HERO_STEM else STANDARD_WIDTHS
            sources.append((src, f"stellar-blade/site/{src.stem}", widths, None))
    return sorted(sources, key=lambda s: str(s[0]))


def main():
    start = time.time()
    print("\033[36m=== Generate R2 WebP Variants ===\033[0m")
    print(f"Source: {BASE_IMAGES_DIR} (*_1080p trees + {SITE_DIR_NAME}/)")
    print(f"Output: {STAGING_DIR}")
    print(f"Encode: webp quality={WEBP_QUALITY} method={WEBP_METHOD}\n")

    sources = collect_sources()
    if not sources:
        print("\033[31m✗ No source images found!\033[0m")
        sys.exit(1)

    expected = sum(len(plan_outputs(key, widths)) for _, key, widths, _ in sources)

    # Verbatim copies (no re-encode): finished renders like og-banner.webp.
    copies = 0
    site_dir = BASE_IMAGES_DIR / SITE_DIR_NAME
    if site_dir.exists():
        for name in sorted(SITE_COPY_AS_IS):
            src = site_dir / name
            if not src.exists():
                print(f"\033[33m⚠ expected {SITE_DIR_NAME}/{name} not found, skipping\033[0m")
                continue
            dest = STAGING_DIR / 'stellar-blade' / 'site' / name
            expected += 1
            if dest.exists():
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            copies += 1

    # Cross-check against url-mapping.json: a pipeline source without a mapping
    # entry has never been uploaded to Cloudinary (fine for brand-new content,
    # unexpected during the migration itself).
    unmapped = []
    if MAPPING_FILE.exists():
        mapping = json.load(open(MAPPING_FILE, encoding='utf-8'))
        unmapped = [mk for _, _, _, mk in sources if mk is not None and mk not in mapping]
        print(f"Sources: {len(sources)} images ({len(sources) - len([s for s in sources if s[3] is None])} pipeline + {len([s for s in sources if s[3] is None])} site)")
        print(f"Mapping: {len(mapping)} entries; pipeline sources not in mapping: {len(unmapped)}")
        for mk in unmapped[:10]:
            print(f"\033[33m    ⚠ {mk}\033[0m")
        if len(unmapped) > 10:
            print(f"\033[33m    ... and {len(unmapped) - 10} more\033[0m")
    else:
        print("\033[33m⚠ url-mapping.json not found, skipping mapping cross-check\033[0m")
    print(f"Expected staged files: {expected}\n")

    created, skipped, errors = copies, 0, []
    workers = os.cpu_count() or 4
    done = 0
    with ProcessPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(process_image, src, key, widths): src for src, key, widths, _ in sources}
        for future in as_completed(futures):
            c, s, err = future.result()
            created += c
            skipped += s
            if err:
                errors.append(err)
            done += 1
            if done % 200 == 0 or done == len(sources):
                elapsed = time.time() - start
                print(f"\033[90m[{done}/{len(sources)}] {created} created, {skipped} skipped, {len(errors)} errors ({elapsed:.0f}s)\033[0m")

    staged = sum(1 for _ in STAGING_DIR.rglob('*.webp'))
    elapsed = time.time() - start
    minutes, seconds = int(elapsed // 60), int(elapsed % 60)

    print(f"\n\033[36m=== Summary ===\033[0m")
    print(f"\033[32m✓ Created: {created}\033[0m")
    print(f"\033[90m→ Skipped (already staged): {skipped}\033[0m")
    if errors:
        print(f"\033[31m✗ Errors: {len(errors)}\033[0m")
        for err in errors[:10]:
            print(f"\033[31m    {err}\033[0m")
    print(f"→ Staged files on disk: {staged}")
    print(f"→ Time: {minutes}m {seconds}s ({workers} workers)")

    if staged == expected and not errors:
        print(f"\033[32m✓ Staged count matches expected ({expected})\033[0m")
    else:
        print(f"\033[31m✗ Staged {staged} != expected {expected} (or errors above) — investigate before uploading\033[0m")
        sys.exit(1)


if __name__ == '__main__':
    main()
