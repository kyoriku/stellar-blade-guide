import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import glob
import re
from pathlib import Path
from dotenv import load_dotenv

from images.paths import normalize_image_path

load_dotenv()

# Rewrites image URLs for the R2 migration, modeled on update_urls.py.
# Three passes:
#   apply   : Cloudinary URL -> R2 URL via r2-url-mapping.json (version-agnostic),
#             plus staged local /assets/images/... paths -> derived R2 URLs
#             (the permanent new-content path; guarded on the staged file existing)
#   reverse : R2 URL -> Cloudinary URL via the inverted mapping (migration
#             entries only; staged-path rewrites roll back via git)
#   categoryimages : same apply logic over client/src/constants/categoryImages.ts

R2_MAPPING_FILE = Path(__file__).parent / 'r2-url-mapping.json'
SEED_BASE = Path(__file__).resolve().parents[2] / 'seed-data'
STAGING_DIR = Path(__file__).resolve().parents[3] / 'r2-staging'
CATEGORY_IMAGES_TS = Path(__file__).resolve().parents[3] / 'client' / 'src' / 'constants' / 'categoryImages.ts'
R2_BASE = (os.getenv('R2_PUBLIC_BASE_URL') or 'https://img.stellarbladeguide.com').rstrip('/')

STAGED_PREFIX = '/assets/images/'


def strip_version(url):
    return re.sub(r'/v\d+/', '/', url)


def derive_key(staged_path):
    """Mirror upload_cloudinary.py/generate_variants.py public_id derivation,
    from a staged /assets/images/<OriginalCase path> reference."""
    rel_path_clean = Path(staged_path[len(STAGED_PREFIX):])
    folder_path = rel_path_clean.parent.as_posix().replace('_', '-').replace(' ', '-').lower()
    filename = rel_path_clean.stem.replace('_', '-').replace(' ', '-').replace('&', 'and').lower()
    if rel_path_clean.parts[0] == 'Walkthroughs':
        return f"stellar-blade/{folder_path}/{filename}"
    return f"stellar-blade/collectibles/{folder_path}/{filename}"


def load_indexes():
    if not R2_MAPPING_FILE.exists():
        print("\033[31m✗ r2-url-mapping.json not found — run upload_r2.py first\033[0m")
        sys.exit(1)
    r2_mapping = json.load(open(R2_MAPPING_FILE, encoding='utf-8'))
    forward = {strip_version(k): v for k, v in r2_mapping.items()}
    reverse = {v: k for k, v in r2_mapping.items()}
    return forward, reverse


def convert_url(url, forward, stats):
    """Return the rewritten URL or None if unchanged."""
    # Copy-paste authoring: absolute host paths normalize before the staged
    # check, so they derive and rewrite like canonical /assets/images/ paths.
    # This rewrite is also what canonicalizes the authored file on disk.
    url = normalize_image_path(url)
    if 'res.cloudinary.com' in url:
        new_url = forward.get(strip_version(url))
        if new_url:
            return new_url
        stats['not_found'].add(url)
        return None
    if url.startswith(STAGED_PREFIX):
        key = derive_key(url)
        if (STAGING_DIR / f"{key}.webp").exists():
            stats['staged'] += 1
            return f"{R2_BASE}/{key}.webp"
        stats['staged_missing'].add(url)
        return None
    return None


def revert_url(url, reverse, stats):
    if url.startswith(R2_BASE):
        old = reverse.get(url)
        if old:
            return old
        stats['not_found'].add(url)
    return None


def seed_files(content_type):
    files = []
    if content_type in ('collectibles', 'all'):
        files += sorted(glob.glob(str(SEED_BASE / 'collectibles' / '*' / '*.json')))
    if content_type in ('walkthroughs', 'all'):
        files += sorted(glob.glob(str(SEED_BASE / 'walkthroughs' / '**' / '*.json'), recursive=True))
    return files


def rewrite_seed(dry_run, content_type, direction):
    forward, reverse = load_indexes()
    stats = {'not_found': set(), 'staged': 0, 'staged_missing': set()}
    conv = (lambda u: convert_url(u, forward, stats)) if direction == 'apply' else (lambda u: revert_url(u, reverse, stats))

    files = seed_files(content_type)
    print(f"\n\033[36m=== {direction.upper()} ({content_type}): {len(files)} seed JSON files ===\033[0m")
    if not files:
        print(f"\033[31m✗ No JSON files found in {SEED_BASE}\033[0m")
        return

    updated_files = 0
    updated_urls = 0

    for json_file in files:
        with open(json_file, encoding='utf-8') as f:
            data = json.load(f)

        file_count = 0

        def visit(img_holder, field='url'):
            nonlocal file_count
            new = conv(img_holder[field]) if img_holder.get(field) else None
            if new and new != img_holder[field]:
                if not dry_run:
                    img_holder[field] = new
                file_count += 1

        if isinstance(data, list):
            for item in data:
                for img in item.get('images', []):
                    visit(img)
        elif isinstance(data, dict):
            visit(data, 'thumbnail_url')
            for block in data.get('content', []):
                for img in block.get('images', []):
                    visit(img)

        if file_count:
            rel = Path(json_file).relative_to(SEED_BASE)
            tag = '[DRY RUN] would update' if dry_run else '[UPDATED]'
            colour = '\033[33m' if dry_run else '\033[32m'
            print(f"{colour}{tag}: {rel} ({file_count} URLs)\033[0m")
            if not dry_run:
                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
            updated_files += 1
            updated_urls += file_count

    print(f"\n\033[36m=== Summary ===\033[0m")
    verb = 'Would update' if dry_run else 'Updated'
    print(f"\033[{'33' if dry_run else '32'}m{verb} {updated_files} files / {updated_urls} URLs\033[0m")
    if stats['staged']:
        print(f"\033[36m→ {stats['staged']} staged local paths rewritten via derivation\033[0m")
    if stats['staged_missing']:
        print(f"\033[31m⚠ {len(stats['staged_missing'])} staged paths have NO staged file (run generate_variants + upload_r2 first):\033[0m")
        for u in sorted(stats['staged_missing'])[:10]:
            print(f"\033[31m    {u}\033[0m")
    if stats['not_found']:
        print(f"\033[31m⚠ {len(stats['not_found'])} URLs not found in mapping:\033[0m")
        for u in sorted(stats['not_found'])[:10]:
            print(f"\033[31m    {u}\033[0m")


def rewrite_category_images(dry_run):
    forward, _ = load_indexes()
    stats = {'not_found': set(), 'staged': 0, 'staged_missing': set()}
    text = CATEGORY_IMAGES_TS.read_text(encoding='utf-8')
    urls = sorted(set(re.findall(r"https://res\.cloudinary\.com/[^'\"]+", text)))

    print(f"\n\033[36m=== categoryImages.ts: {len(urls)} distinct Cloudinary URLs ===\033[0m")
    replaced = 0
    for url in urls:
        new = convert_url(url, forward, stats)
        if new:
            count = text.count(url)
            tag = '[DRY RUN] would replace' if dry_run else '[REPLACED]'
            colour = '\033[33m' if dry_run else '\033[32m'
            print(f"{colour}{tag} ({count}x): .../{url.rsplit('/', 1)[-1]} -> .../{new.rsplit('/', 1)[-1]}\033[0m")
            text = text.replace(url, new)
            replaced += count

    print(f"\n\033[36m=== Summary ===\033[0m")
    verb = 'Would replace' if dry_run else 'Replaced'
    print(f"\033[{'33' if dry_run else '32'}m{verb} {replaced} URL occurrences\033[0m")
    if stats['not_found']:
        print(f"\033[31m⚠ {len(stats['not_found'])} URLs not in mapping (left untouched):\033[0m")
        for u in sorted(stats['not_found']):
            print(f"\033[31m    {u}\033[0m")
    if not dry_run and replaced:
        CATEGORY_IMAGES_TS.write_text(text, encoding='utf-8')
        print(f"\033[32m✓ Wrote {CATEGORY_IMAGES_TS}\033[0m")


def run_with_confirm(dry_fn, apply_fn):
    dry_fn()
    print("\n\033[33mApply these changes? (y/n):\033[0m ", end='')
    try:
        confirm = input().strip().lower()
    except EOFError:
        confirm = ''
    if confirm == 'y':
        apply_fn()
        print("\n\033[32m✓ Complete\033[0m")
    else:
        print("\n\033[90mExited without changes\033[0m")


if __name__ == '__main__':
    print("\033[36m=== Update R2 URLs Script ===\033[0m")

    content_type = 'all'
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in ('collectibles', 'walkthroughs', 'all'):
            content_type = arg
        else:
            print(f"\033[31m✗ Invalid argument: {sys.argv[1]}\033[0m")
            print("Usage: python update_r2_urls.py [collectibles|walkthroughs|all]")
            sys.exit(1)

    print("\n\033[36m=== Select Operation ===\033[0m")
    print("1. Apply R2 URLs to seed JSON")
    print("2. Reverse seed JSON to Cloudinary URLs")
    print("3. Rewrite categoryImages.ts to R2 URLs")
    print("4. Exit")
    try:
        op = input("\nChoose operation (1/2/3/4): ").strip()
    except EOFError:
        op = ''

    if op == '1':
        run_with_confirm(
            lambda: rewrite_seed(True, content_type, 'apply'),
            lambda: rewrite_seed(False, content_type, 'apply'),
        )
    elif op == '2':
        run_with_confirm(
            lambda: rewrite_seed(True, content_type, 'reverse'),
            lambda: rewrite_seed(False, content_type, 'reverse'),
        )
    elif op == '3':
        run_with_confirm(
            lambda: rewrite_category_images(True),
            lambda: rewrite_category_images(False),
        )
    else:
        print("\n\033[90mExited\033[0m")
