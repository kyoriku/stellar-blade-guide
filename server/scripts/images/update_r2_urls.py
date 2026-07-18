import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import glob
from pathlib import Path
from dotenv import load_dotenv

from images.paths import normalize_image_path

load_dotenv()

# Rewrites staged local /assets/images/... paths in seed JSON to derived R2
# URLs (the permanent new-content path; guarded on the staged file existing).
# Dry run + confirm before every write.

SEED_BASE = Path(__file__).resolve().parents[2] / 'seed-data'
STAGING_DIR = Path(__file__).resolve().parents[3] / 'r2-staging'
R2_BASE = (os.getenv('R2_PUBLIC_BASE_URL') or 'https://img.stellarbladeguide.com').rstrip('/')

STAGED_PREFIX = '/assets/images/'


def derive_key(staged_path):
    """Mirror generate_variants.py public_id derivation, from a staged
    /assets/images/<OriginalCase path> reference."""
    rel_path_clean = Path(staged_path[len(STAGED_PREFIX):])
    folder_path = rel_path_clean.parent.as_posix().replace('_', '-').replace(' ', '-').lower()
    filename = rel_path_clean.stem.replace('_', '-').replace(' ', '-').replace('&', 'and').lower()
    if rel_path_clean.parts[0] == 'Walkthroughs':
        return f"stellar-blade/{folder_path}/{filename}"
    return f"stellar-blade/collectibles/{folder_path}/{filename}"


def convert_url(url, stats):
    """Return the rewritten URL or None if unchanged."""
    # Copy-paste authoring: absolute host paths normalize before the staged
    # check, so they derive and rewrite like canonical /assets/images/ paths.
    # This rewrite is also what canonicalizes the authored file on disk.
    url = normalize_image_path(url)
    if url.startswith(STAGED_PREFIX):
        key = derive_key(url)
        if (STAGING_DIR / f"{key}.webp").exists():
            stats['staged'] += 1
            return f"{R2_BASE}/{key}.webp"
        stats['staged_missing'].add(url)
        return None
    return None


def seed_files(content_type):
    files = []
    if content_type in ('collectibles', 'all'):
        files += sorted(glob.glob(str(SEED_BASE / 'collectibles' / '*' / '*.json')))
    if content_type in ('walkthroughs', 'all'):
        files += sorted(glob.glob(str(SEED_BASE / 'walkthroughs' / '**' / '*.json'), recursive=True))
    return files


def rewrite_seed(dry_run, content_type):
    stats = {'staged': 0, 'staged_missing': set()}

    files = seed_files(content_type)
    print(f"\n\033[36m=== APPLY ({content_type}): {len(files)} seed JSON files ===\033[0m")
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
            new = convert_url(img_holder[field], stats) if img_holder.get(field) else None
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

    run_with_confirm(
        lambda: rewrite_seed(True, content_type),
        lambda: rewrite_seed(False, content_type),
    )
