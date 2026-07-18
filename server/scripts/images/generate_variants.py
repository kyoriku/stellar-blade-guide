import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import re
import shutil
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
from PIL import Image

# Pre-generates every WebP file R2 serves, sourced from the masters tree at
# native resolution (the masters tree is the publication manifest: curated
# captures only; a file present there WILL publish). Layout in r2-staging/
# mirrors R2 keys exactly: {key}.webp (full size, lightbox/stored URL) +
# {key}-w{N}.webp variants. Keys are a pure function of the masters-relative
# path (kebab-cased; see derive_key).

STANDARD_WIDTHS = [640, 960, 1200, 1600]
HERO_WIDTHS = [640, 960, 1200, 1600, 1920, 2560]
WEBP_QUALITY = 80
WEBP_METHOD = 6
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

BASE_IMAGES_DIR = Path(__file__).parent.parent.parent.parent / 'client' / 'public' / 'assets' / 'images'
STAGING_DIR = Path(__file__).parent.parent.parent.parent / 'r2-staging'
SEED_DATA_DIR = Path(__file__).parent.parent.parent / 'seed-data'
CLIENT_SRC_DIR = Path(__file__).parent.parent.parent.parent / 'client' / 'src'
R2_BASE = 'https://img.stellarbladeguide.com/'

# Pipeline references live in two states: swapped R2 URLs (at rest) and
# authored local paths (mid-workflow, pre-swap). Site/ assets are exempt
# from the manifest by construction: the R2 pattern only captures
# collectibles/walkthroughs keys. Any URL literal counts as a reference,
# including commented-out client lines - conservative on purpose.
# Copy-paste authoring contract (scripts/images/paths.py): authored refs may
# be absolute host paths; LOCAL_REF_PATTERN matches from the /assets/images/
# tail of the marker segment, so absolute and canonical forms capture the
# same masters-relative path by construction.
R2_REF_PATTERN = re.compile(
    re.escape(R2_BASE) + r'(stellar-blade/(?:collectibles|walkthroughs)/[^\'"\s`)]+?)\.webp')
LOCAL_REF_PATTERN = re.compile(r'/assets/images/([^\'"\n]+?\.(?:jpg|jpeg|png|webp))')

# Site/ assets are full-resolution one-offs keyed under stellar-blade/site/.
# og-banner.webp is a finished 1200x630 social card: copied verbatim, no variants.
SITE_DIR_NAME = 'Site'
SITE_COPY_AS_IS = {'og-banner.webp'}
SITE_HERO_STEM = 'home-hero'


def derive_key(rel_path_clean):
    """Derive the R2 key from a masters-relative path (kebab-cased)."""
    folder_path = rel_path_clean.parent.as_posix().replace('_', '-').replace(' ', '-').lower()
    filename = rel_path_clean.stem.replace('_', '-').replace(' ', '-').replace('&', 'and').lower()
    if rel_path_clean.parts[0] == 'Walkthroughs':
        return f"stellar-blade/{folder_path}/{filename}"
    return f"stellar-blade/collectibles/{folder_path}/{filename}"


def collect_references():
    """Every pipeline-image reference in seed data and client source.

    Returns (r2_keys, local_rels): R2 references as derived keys, authored
    local references as masters-tree-relative paths. Together with
    check_manifest() this is the manifest check: it proves every master is
    referenced by a live page and every referenced image has a master.
    """
    r2_keys, local_rels = set(), set()
    ref_files = sorted(SEED_DATA_DIR.rglob('*.json'))
    ref_files += sorted(p for p in CLIENT_SRC_DIR.rglob('*')
                        if p.is_file() and p.suffix in ('.ts', '.tsx'))
    for p in ref_files:
        text = p.read_text(encoding='utf-8')
        r2_keys.update(m.group(1) for m in R2_REF_PATTERN.finditer(text))
        local_rels.update(m.group(1) for m in LOCAL_REF_PATTERN.finditer(text))
    return r2_keys, local_rels


def check_manifest(sources, r2_refs, local_refs):
    """Seed-based manifest check over the pipeline sources.

    Returns a dict of problem lists (all empty on a clean tree):
      dup_keys      - two masters deriving the same R2 key (staging would collide)
      unreferenced  - masters no seed entry or client constant points at
      masterless    - references that resolve to no master (R2 key unknown,
                      or authored local path whose file does not exist)
    plus referenced-count stats for the one-line summary.
    """
    masters = [(mk[len('/assets/images/'):], key)
               for _, key, _, mk in sources if mk is not None]
    key_owner = {}
    dup_keys = []
    for rel, key in masters:
        if key in key_owner:
            dup_keys.append((key, key_owner[key], rel))
        else:
            key_owner[key] = rel
    unreferenced = sorted(rel for rel, key in masters
                          if key not in r2_refs and rel not in local_refs)
    masterless = sorted(f'{R2_BASE}{k}.webp' for k in r2_refs if k not in key_owner)
    masterless += sorted(f'/assets/images/{r}' for r in local_refs
                         if not (BASE_IMAGES_DIR / r).exists())
    return {
        'dup_keys': dup_keys,
        'unreferenced': unreferenced,
        'masterless': masterless,
        'total': len(masters),
        'referenced': len(masters) - len(unreferenced),
        'r2_refs': len(r2_refs),
        'local_refs': len(local_refs),
    }


LEDGER_FILE = Path(__file__).parent / 'prune-pending.json'


def run_manifest_check(sources):
    """Run the manifest check and print its summary + flags; returns the
    check_manifest result dict."""
    r2_refs, local_refs = collect_references()
    m = check_manifest(sources, r2_refs, local_refs)
    print(f"Seed check: {m['referenced']}/{m['total']} masters referenced "
          f"({m['r2_refs']} r2 + {m['local_refs']} local refs); "
          f"unreferenced: {len(m['unreferenced'])}; masterless refs: {len(m['masterless'])}; "
          f"duplicate keys: {len(m['dup_keys'])}")
    for key, a, b in m['dup_keys'][:10]:
        print(f"\033[31m    ⚠ DUPLICATE KEY {key}: {a} and {b}\033[0m")
    for rel in m['unreferenced'][:10]:
        print(f"\033[31m    ⚠ UNREFERENCED MASTER: {rel}\033[0m")
    for ref in m['masterless'][:10]:
        print(f"\033[31m    ⚠ NO MASTER FOR REF: {ref}\033[0m")
    for name, lst in (('unreferenced', m['unreferenced']), ('masterless refs', m['masterless'])):
        if len(lst) > 10:
            print(f"\033[31m    ... and {len(lst) - 10} more {name}\033[0m")
    return m


def offer_prune(unreferenced):
    """Interactive prune gate: converts the fatal unreferenced-masters stop
    into list -> typed confirm -> delete local surfaces -> ledger bucket keys.

    Deletes ONLY the master file and its staged files (prod-invisible
    surfaces). The 5 bucket keys per image go to prune-pending.json for
    scripts/images/prune_bucket.py, which runs AFTER prod_seed.py — deleting
    bucket objects earlier would 404 prod images that still reference them
    (prod's DB keeps the old URLs until it is reseeded). Returns True if the
    local surfaces were deleted; False (declined/EOF) keeps the fatal stop.
    Never called when stdin is not a tty: non-interactive runs stay fatal so
    one bad seed edit cannot delete source files without a human reading
    this list.
    """
    print(f"\n\033[33m{len(unreferenced)} unreferenced master(s) found. Pruning deletes each"
          f" master + its staged files now and ledgers its 5 bucket keys for"
          f" prune_bucket.py (run that after prod_seed.py). Declining keeps the fatal stop.\033[0m")
    plan = []
    for rel in unreferenced:
        key = derive_key(Path(rel))
        object_keys = [f'{key}.webp'] + [f'{key}-w{w}.webp' for w in STANDARD_WIDTHS]
        plan.append({'master': rel, 'key': key, 'object_keys': object_keys})
        print(f"  master: {rel}")
        print(f"    10 artifacts (each key = 1 staged file + 1 bucket object):")
        for k in object_keys:
            print(f"      {k}")
    try:
        answer = input(f"\nType 'prune' to delete {len(plan)} master(s) + staged files"
                       f" and ledger the bucket keys: ")
    except EOFError:
        return False
    if answer.strip() != 'prune':
        print("\033[33mDeclined — keeping the fatal stop.\033[0m")
        return False

    deleted_masters = deleted_staged = 0
    for p in plan:
        (BASE_IMAGES_DIR / p['master']).unlink()
        deleted_masters += 1
        for k in p['object_keys']:
            staged = STAGING_DIR / k
            if staged.exists():
                staged.unlink()
                deleted_staged += 1
    ledger = json.loads(LEDGER_FILE.read_text()) if LEDGER_FILE.exists() else []
    ledger.extend(plan)
    LEDGER_FILE.write_text(json.dumps(ledger, indent=1))
    print(f"\033[32m✓ Pruned {deleted_masters} master(s), {deleted_staged} staged file(s); "
          f"{len(ledger)} image(s) pending in {LEDGER_FILE.name}\033[0m")
    print(f"\033[33m→ After prod_seed.py, run: uv run python scripts/images/prune_bucket.py\033[0m")
    return True


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
    """(src_path, key, widths, local_key) for every image to stage.

    local_key is the authored-reference form (/assets/images/<path>) for
    pipeline masters, None for Site/ assets (exempt from the manifest check).

    Enumerates the masters tree: every top-level directory except the retired
    *_1080p trees and Site/ (special-cased below). Root-level loose files are
    never enumerated (promo art, not pipeline content).
    """
    sources = []
    for top in sorted(BASE_IMAGES_DIR.iterdir()):
        if not top.is_dir() or '_1080p' in top.name or top.name == SITE_DIR_NAME:
            continue
        for src in top.rglob('*'):
            if not src.is_file() or src.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            rel_path = src.relative_to(BASE_IMAGES_DIR)
            key = derive_key(rel_path)
            local_key = f"/assets/images/{rel_path.as_posix()}"
            sources.append((src, key, STANDARD_WIDTHS, local_key))

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
    print(f"Source: {BASE_IMAGES_DIR} (masters tree at native resolution + {SITE_DIR_NAME}/)")
    print(f"Output: {STAGING_DIR}")
    print(f"Encode: webp quality={WEBP_QUALITY} method={WEBP_METHOD}\n")

    sources = collect_sources()
    if not sources:
        print("\033[31m✗ No source images found!\033[0m")
        sys.exit(1)

    # Manifest check: masters <-> live references (seed data + client
    # constants). Every master must be referenced by a page, and every
    # reference must have a master. Authored local paths (pre-swap state,
    # absolute or canonical) count as valid references when the master exists.
    pipeline_count = sum(1 for _, _, _, mk in sources if mk is not None)
    print(f"Sources: {len(sources)} images ({pipeline_count} pipeline + {len(sources) - pipeline_count} site)")
    m = run_manifest_check(sources)

    # Prune gate: interactively converts the fatal unreferenced-masters stop
    # into list -> typed confirm -> delete local surfaces -> ledger bucket
    # keys, then re-derives everything from disk and re-checks. Declined,
    # EOF, or non-interactive runs fall through to the fatal path unchanged.
    if m['unreferenced'] and sys.stdin.isatty():
        if offer_prune(m['unreferenced']):
            sources = collect_sources()
            pipeline_count = sum(1 for _, _, _, mk in sources if mk is not None)
            print(f"\nPost-prune sources: {len(sources)} images ({pipeline_count} pipeline + {len(sources) - pipeline_count} site)")
            m = run_manifest_check(sources)

    manifest_bad = len(m['dup_keys']) + len(m['unreferenced']) + len(m['masterless'])

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

    if staged == expected and not errors and manifest_bad == 0:
        print(f"\033[32m✓ Staged count matches expected ({expected}); manifest checks clean\033[0m")
    else:
        if manifest_bad:
            print(f"\033[31m✗ Manifest checks flagged {manifest_bad} problem(s) above — investigate before uploading\033[0m")
        if staged != expected or errors:
            print(f"\033[31m✗ Staged {staged} != expected {expected} (or errors above) — investigate before uploading\033[0m")
        sys.exit(1)


if __name__ == '__main__':
    main()
