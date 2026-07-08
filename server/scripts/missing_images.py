# scripts/missing_images.py
"""
Scan seed-data for collectibles and walkthroughs that still lack images and
write the private status doc docs/missing-images.md (gitignored).

The doc is script output - never hand-edit it; rerun after every capture
session. Read-only against seed data; the doc is the only file written.

Usage:
  cd server && uv run python scripts/missing_images.py
"""

import json
import re
from datetime import datetime
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
SEED_DIR = SERVER_DIR / "seed-data"
DOC_PATH = SERVER_DIR.parent / "docs" / "missing-images.md"
SEED_DB_SOURCE = SERVER_DIR / "scripts" / "db" / "seed_db.py"

CLOUDINARY = "res.cloudinary.com"
STAGED_PREFIX = "/assets/"
CYCLE_ORDER = ["base", "ng+", "ng++", "dlc"]
UNRANKED = 10**6
WALKTHROUGH_CATEGORIES = [
    "main-story",
    "side-quests",
    "bulletin-board-requests",
    "dlc/nier",
    "dlc/nikke",
]


def classify_urls(urls: list[str]) -> str:
    """none | staged | mixed | complete | anomaly for a list of image URLs."""
    if not urls:
        return "none"
    cloud = sum(1 for u in urls if CLOUDINARY in u)
    staged = sum(1 for u in urls if u.startswith(STAGED_PREFIX))
    if cloud + staged != len(urls):
        return "anomaly"
    if cloud == len(urls):
        return "complete"
    if staged == len(urls):
        return "staged"
    return "mixed"


def disambiguate(titles: list[str]) -> list[str]:
    """Duplicate titles get -1/-2 suffixes in file order (buildSlugMap semantics)."""
    total = {}
    for t in titles:
        total[t] = total.get(t, 0) + 1
    seen = {}
    out = []
    for t in titles:
        if total[t] > 1:
            seen[t] = seen.get(t, 0) + 1
            out.append(f"{t} -{seen[t]}")
        else:
            out.append(t)
    return out


def _slug(name: str) -> str:
    return name.lower().replace(" ", "-")


def load_seed_order():
    """Parse ordering from seed_db.py, the single source of truth (its data lives
    inside a function as ORM constructors, so it can't be imported).

    Returns (level_order, loc_order, type_rank):
      level_order: level slug -> display_order
      loc_order:   (level slug, location slug) -> display_order
      type_rank:   type name -> (category-group rank in seed order, display_order)
    """
    src = SEED_DB_SOURCE.read_text()

    levels = re.findall(r"Level\(name='([^']+)',\s*display_order=(\d+)\)", src)
    locs = re.findall(
        r"Location\(level_id=levels\['([^']+)'\]\.id,\s*name='([^']+)',\s*display_order=(\d+)\)", src
    )
    types = re.findall(
        r"CollectibleType\(name='([^']+)',\s*category_group='([^']+)',\s*display_order=(\d+)", src
    )
    if not levels or not locs or not types:
        raise SystemExit(
            f"could not parse ordering from {SEED_DB_SOURCE} "
            f"(levels={len(levels)}, locations={len(locs)}, types={len(types)})"
        )

    level_order = {_slug(name): int(order) for name, order in levels}
    loc_order = {(_slug(lvl), _slug(name)): int(order) for lvl, name, order in locs}
    group_rank = {}
    for _, group, _ in types:
        group_rank.setdefault(group, len(group_rank))
    type_rank = {name: (group_rank[group], int(order)) for name, group, order in types}
    return level_order, loc_order, type_rank


def type_label(c: dict) -> str:
    """Joined type names; multi-type items appear once under a combined label."""
    types = c.get("types") or ([c["type"]] if c.get("type") else [])
    return " / ".join(types) if types else "(untyped)"


def scan_collectibles():
    """Return (counts, missing_by_cycle, records, loc_totals, complete_levels, anomalies).

    records: one dict per collectible missing images
             {level, location, title, state, cycle, type}
    """
    counts = {"complete": 0, "staged": 0, "none": 0, "anomaly": 0, "total": 0}
    missing_by_cycle = {}
    records = []
    loc_totals = {}
    complete_levels = []
    anomalies = []

    for level_dir in sorted(p for p in (SEED_DIR / "collectibles").iterdir() if p.is_dir()):
        level = level_dir.name
        level_missing = 0
        for loc_file in sorted(level_dir.glob("*.json")):
            entries = json.loads(loc_file.read_text())
            display = disambiguate([c.get("title", "(untitled)") for c in entries])
            loc_totals[(level, loc_file.stem)] = len(entries)
            for title, c in zip(display, entries):
                state = classify_urls([i["url"] for i in (c.get("images") or [])])
                counts["total"] += 1
                if state == "complete":
                    counts["complete"] += 1
                    continue
                if state in ("staged", "mixed"):
                    counts["staged"] += 1
                elif state == "anomaly":
                    counts["anomaly"] += 1
                    anomalies.append(f"{level}/{loc_file.stem}: {title}")
                else:
                    counts["none"] += 1
                cycle = (c.get("cycle") or "Base").lower()
                missing_by_cycle[cycle] = missing_by_cycle.get(cycle, 0) + 1
                records.append({
                    "level": level,
                    "location": loc_file.stem,
                    "title": title,
                    "state": state,
                    "cycle": cycle,
                    "type": type_label(c),
                })
                level_missing += 1
        if not level_missing:
            complete_levels.append(level)
    return counts, missing_by_cycle, records, loc_totals, complete_levels, anomalies


def cycle_breakdown(missing_by_cycle: dict, total_missing: int) -> str:
    """e.g. '122 collectibles missing images: 82 base / 0 ng+ / 23 ng++ / 17 dlc'."""
    known = [f"{missing_by_cycle.get(c, 0)} {c}" for c in CYCLE_ORDER]
    extra = [f"{missing_by_cycle[c]} {c}" for c in sorted(missing_by_cycle) if c not in CYCLE_ORDER]
    return f"{total_missing} collectibles missing images: " + " / ".join(known + extra)


def walkthrough_sort_key(path: Path):
    prefix = path.stem.split("-", 1)[0]
    return (int(prefix), path.stem) if prefix.isdigit() else (UNRANKED, path.stem)


def scan_walkthroughs():
    """Return (counts, categories, anomalies).

    categories: {category: {"total": int, "incomplete": [detail line]}}
    """
    counts = {"complete": 0, "staged": 0, "incomplete": 0, "total": 0}
    categories = {}
    anomalies = []

    for category in WALKTHROUGH_CATEGORIES:
        cat_dir = SEED_DIR / "walkthroughs" / category
        files = sorted(cat_dir.glob("*.json"), key=walkthrough_sort_key) if cat_dir.is_dir() else []
        cat = {"total": len(files), "incomplete": []}
        for f in files:
            w = json.loads(f.read_text())
            thumb = w.get("thumbnail_url") or ""
            blocks = w.get("content") or []
            unimaged = [b for b in blocks if not b.get("images")]
            urls = [thumb] if thumb else []
            urls += [i["url"] for b in blocks for i in (b.get("images") or [])]
            has_staged = any(u.startswith(STAGED_PREFIX) for u in urls)
            has_anomaly = any(CLOUDINARY not in u and not u.startswith(STAGED_PREFIX) for u in urls)
            counts["total"] += 1
            if has_anomaly:
                anomalies.append(f"walkthroughs/{category}/{f.stem}")

            if thumb and not unimaged and not has_staged:
                counts["complete"] += 1
                continue
            counts["staged" if has_staged else "incomplete"] += 1

            parts = [f"thumbnail {'ok' if thumb else 'MISSING'}",
                     f"{len(blocks) - len(unimaged)}/{len(blocks)} sections imaged"]
            if unimaged:
                sections = ", ".join(f"{b.get('order', '?')} ({b.get('section_title', '?')})" for b in unimaged)
                parts.append(f"missing sections: {sections}")
            if has_staged:
                parts.append("staged uploads pending")
            cat["incomplete"].append(f"{f.stem}: " + "; ".join(parts))
        categories[category] = cat
    return counts, categories, anomalies


def state_suffix(state: str) -> str:
    return {"staged": " (staged)", "mixed": " (staged, mixed)", "anomaly": " (ANOMALOUS URL)"}.get(state, "")


def grouped(records: list[dict], key: str, order: dict) -> list[tuple[str, list[dict]]]:
    """Group by field, ordered by rank (name -> rank), unknowns last alphabetically."""
    out = {}
    for r in records:
        out.setdefault(r[key], []).append(r)
    return sorted(out.items(), key=lambda kv: (order.get(kv[0], UNRANKED), kv[0]))


def item_clusters(records: list[dict], type_rank: dict, lines: list[str]) -> None:
    """One nested bullet list: type as the outer bullet, items indented under it,
    clusters in collectible-type seed order (category group, then type display_order),
    items alphabetical within a type. Single-item clusters flatten to one bullet:
    'Type: Item' unless the title already contains the type name."""
    clusters = {}
    for r in records:
        clusters.setdefault(r["type"], []).append(r)

    def cluster_key(label):
        ranks = [type_rank.get(part, (UNRANKED, UNRANKED)) for part in label.split(" / ")]
        return (min(ranks), label)

    def item(r):
        return f"{r['title']} ({r['cycle']}){state_suffix(r['state'])}"

    for label in sorted(clusters, key=cluster_key):
        recs = sorted(clusters[label], key=lambda r: r["title"])
        if len(recs) == 1:
            r = recs[0]
            if label.lower() in r["title"].lower():
                lines.append(f"- {item(r)}")
            else:
                lines.append(f"- {label}: {item(r)}")
        else:
            lines.append(f"- {label}")
            lines.extend(f"  - {item(r)}" for r in recs)
    lines.append("")


def render_collectibles(records, loc_totals, complete_levels, orders, lines) -> None:
    level_order, loc_order, type_rank = orders
    lines += [
        "## Collectibles with missing images",
        "",
        "Levels and locations are in game order (display_order from seed_db.py; locations "
        "added outside seed_db.py sort last). Type clusters follow the collectible-type "
        "seed order (category group, then type); items alphabetical within a type.",
        "",
    ]
    for level, lrecs in grouped(records, "level", level_order):
        lines.append(f"### {level} ({len(lrecs)} missing images)")
        lines.append("")
        per_level_loc_order = {loc: loc_order.get((level, loc), UNRANKED)
                               for loc in {r["location"] for r in lrecs}}
        for loc, recs in grouped(lrecs, "location", per_level_loc_order):
            lines.append(f"**{loc}** ({len(recs)} of {loc_totals[(level, loc)]} images missing)")
            lines.append("")
            item_clusters(recs, type_rank, lines)
    if complete_levels:
        lines.append("All images complete: " + ", ".join(sorted(complete_levels)))
        lines.append("")


def render_walkthroughs(w_counts, categories, lines) -> None:
    lines += ["## Walkthroughs", ""]
    if not any(cat["incomplete"] for cat in categories.values()):
        breakdown = ", ".join(f"{name} {cat['total']}" for name, cat in categories.items())
        lines.append(f"All {w_counts['total']} walkthroughs complete ({breakdown}).")
        lines.append("")
        return
    for name, cat in categories.items():
        if not cat["incomplete"]:
            continue
        lines.append(f"### {name}: {len(cat['incomplete'])} of {cat['total']} incomplete")
        lines.extend(f"- {detail}" for detail in cat["incomplete"])
        lines.append("")
    complete = [f"{name} ({cat['total']})" for name, cat in categories.items() if not cat["incomplete"]]
    if complete:
        lines.append("All complete: " + ", ".join(complete))
        lines.append("")


def build_doc(c_counts, c_by_cycle, records, loc_totals, complete_levels, orders,
              w_counts, categories, anomalies) -> str:
    lines = [
        "# Missing images - seed-data status",
        "",
        f"Generated {datetime.now().strftime('%Y-%m-%d %H:%M')} by `server/scripts/missing_images.py`. "
        "Do not hand-edit; rerun the script.",
        "",
        "## Summary",
        "",
        f"Collectibles: {c_counts['complete']} complete / {c_counts['staged']} staged / "
        f"{c_counts['none']} missing images / {c_counts['total']} total",
        "",
        f"Walkthroughs: {w_counts['complete']} complete / {w_counts['staged']} staged / "
        f"{w_counts['incomplete']} incomplete / {w_counts['total']} total",
        "",
        cycle_breakdown(c_by_cycle, len(records)),
        "",
    ]
    render_collectibles(records, loc_totals, complete_levels, orders, lines)
    render_walkthroughs(w_counts, categories, lines)

    if anomalies:
        lines.append("## Anomalies (URLs that are neither Cloudinary nor /assets/ keys)")
        lines.append("")
        lines.extend(f"- {a}" for a in anomalies)
        lines.append("")

    return "\n".join(lines)


def main():
    c_counts, c_by_cycle, records, loc_totals, complete_levels, c_anomalies = scan_collectibles()
    w_counts, categories, w_anomalies = scan_walkthroughs()
    anomalies = c_anomalies + w_anomalies
    orders = load_seed_order()

    DOC_PATH.parent.mkdir(exist_ok=True)
    DOC_PATH.write_text(build_doc(c_counts, c_by_cycle, records, loc_totals, complete_levels,
                                  orders, w_counts, categories, anomalies))

    print(f"Collectibles: {c_counts['complete']} complete, {c_counts['staged']} staged, "
          f"{c_counts['none']} missing images (of {c_counts['total']})")
    print("  " + cycle_breakdown(c_by_cycle, len(records)))
    print(f"Walkthroughs: {w_counts['complete']} complete, {w_counts['staged']} staged, "
          f"{w_counts['incomplete']} incomplete (of {w_counts['total']})")
    if anomalies:
        print(f"ANOMALIES: {len(anomalies)} (see doc)")
    print(f"Wrote {DOC_PATH}")


if __name__ == "__main__":
    main()
