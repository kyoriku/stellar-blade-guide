"""
One-time migration: extract document subtypes from collectible titles into
a structured `subtype` field, and clean up titles.

Transformations:
  - "X (Subtype)"        -> title="X",        subtype="Subtype"
  - "X (Subtype) / suff" -> title="X / suff", subtype="Subtype"
  - "Subtype - X"        -> title="X",        subtype="Subtype"
  - "Prayer" normalized to "Prayers"

Only modifies Document collectibles. Non-Documents are left untouched
and do not receive a subtype field.

Usage:
    uv run python scripts/migrate_document_subtypes.py            # dry run
    uv run python scripts/migrate_document_subtypes.py --apply    # write changes
"""

import argparse
import json
import re
import sys
from pathlib import Path

CANONICAL_SUBTYPES = {
    "Series",
    "Promotions",
    "Messages",
    "Journal",
    "Log Data",
    "Books",
    "Information",
    "Prayers",
    "Announcements",
}

# "X (Subtype) / suffix"  e.g. "Third Road (Messages) / λλλλλλ"
RE_TRAIL_PAREN_SUFFIX = re.compile(r"^(.*?)\s*\(([^)]+)\)\s*(/\s*\S+)\s*$")
# "X (Subtype)"
RE_TRAIL_PAREN = re.compile(r"^(.*?)\s*\(([^)]+)\)\s*$")
# "Subtype - X"  (capitalized word(s) before " - ")
RE_LEAD_DASH = re.compile(r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*-\s+(.+)$")


def normalize_subtype(raw: str) -> str:
    """Apply normalizations like Prayer -> Prayers."""
    if raw == "Prayer":
        return "Prayers"
    return raw


def parse_title(title: str):
    """
    Returns (new_title, subtype) on match, or (None, None) if no pattern matches.
    """
    m = RE_TRAIL_PAREN_SUFFIX.match(title)
    if m:
        body, raw_subtype, suffix = m.group(1), m.group(2), m.group(3)
        subtype = normalize_subtype(raw_subtype)
        if subtype in CANONICAL_SUBTYPES:
            return f"{body} {suffix}".strip(), subtype

    m = RE_TRAIL_PAREN.match(title)
    if m:
        body, raw_subtype = m.group(1), m.group(2)
        subtype = normalize_subtype(raw_subtype)
        if subtype in CANONICAL_SUBTYPES:
            return body.strip(), subtype

    m = RE_LEAD_DASH.match(title)
    if m:
        raw_subtype, body = m.group(1), m.group(2)
        subtype = normalize_subtype(raw_subtype)
        if subtype in CANONICAL_SUBTYPES:
            return body.strip(), subtype

    return None, None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true",
                        help="Actually write changes. Without this flag, runs dry.")
    args = parser.parse_args()

    seed_dir = Path(__file__).resolve().parent.parent.parent / "seed-data" / "collectibles"
    if not seed_dir.exists():
        print(f"ERROR: seed dir not found: {seed_dir}")
        sys.exit(1)

    json_files = sorted(seed_dir.rglob("*.json"))
    print(f"Scanning {len(json_files)} seed files...\n")

    changes = []  # (file_path, collectible_id, old_title, new_title, subtype)
    skipped_documents = []  # documents whose titles didn't match any pattern

    for json_file in json_files:
        with open(json_file) as f:
            data = json.load(f)

        for c in data:
            if "Document" not in c.get("types", []):
                continue
            old_title = c["title"]
            new_title, subtype = parse_title(old_title)
            if subtype is None:
                skipped_documents.append((str(json_file), c.get("id"), old_title))
                continue
            changes.append((str(json_file), c.get("id"), old_title, new_title, subtype))

    # Print preview
    print(f"=== Proposed changes: {len(changes)} ===\n")
    for path, cid, old, new, subtype in changes:
        rel = Path(path).relative_to(seed_dir)
        print(f"  [{rel} #{cid}]")
        print(f"    title:   {old!r}")
        print(f"          -> {new!r}")
        print(f"    subtype: {subtype}")
        print()

    if skipped_documents:
        print(f"=== Skipped documents (no subtype detected): {len(skipped_documents)} ===")
        for path, cid, title in skipped_documents:
            rel = Path(path).relative_to(seed_dir)
            print(f"  [{rel} #{cid}] {title!r}")
        print()

    # Subtype distribution
    from collections import Counter
    subtype_counts = Counter(s for _, _, _, _, s in changes)
    print("=== Subtype distribution ===")
    for subtype, count in sorted(subtype_counts.items(), key=lambda x: (-x[1], x[0])):
        print(f"  {count:4d}  {subtype}")
    print()

    if not args.apply:
        print("[DRY RUN] No files written. Re-run with --apply to write changes.")
        return

    # Apply mode: rewrite each file
    print("Writing changes...")
    files_to_change = {}  # path -> list of (collectible_id, new_title, subtype)
    for path, cid, _old, new_title, subtype in changes:
        files_to_change.setdefault(path, []).append((cid, new_title, subtype))

    for path, updates in files_to_change.items():
        with open(path) as f:
            data = json.load(f)

        update_map = {cid: (new_title, subtype) for cid, new_title, subtype in updates}
        for c in data:
            if c.get("id") in update_map:
                new_title, subtype = update_map[c["id"]]
                c["title"] = new_title
                c["subtype"] = subtype
                # Also update image alt text if it matches the old title
                # (skip — alts can stay; can be revisited if needed)

        with open(path, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        rel = Path(path).relative_to(seed_dir)
        print(f"  ✓ {rel} ({len(updates)} updates)")

    print(f"\n✓ Wrote {len(changes)} changes across {len(files_to_change)} files.")


if __name__ == "__main__":
    main()
