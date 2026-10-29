"""
Search evaluation against real Postgres. Read-only: every session is READ ONLY.

Usage (from server/):
  uv run python scripts/search_eval.py --snapshot       # record today's results; run it before search changes
  uv run python scripts/search_eval.py                  # check the current search against the snapshot
  uv run python scripts/search_eval.py --timing         # time the search statement on dev
  uv run python scripts/search_eval.py --prod --timing  # the prod gate: predicted cache-miss time, from prod

--snapshot asks every query below of the search as it stands and writes the answers to
scripts/search-baseline.json (gitignored). The default mode asks the same queries
again, prints the before/after tables and sweeps, runs the stored-column checks, and
exits 1 when:
  - a title that is #1 today is no longer #1, unless a page of the same name, the item's
    own type page, or a walkthrough section of the same title now leads;
  - a level page in today's top 5 for a level + type query leaves the top 5;
  - an item that today's full-text match puts in its top 5 leaves the top 20 (matched
    by title, so identical-title duplicates count as present; a walkthrough by its page,
    so its section results count), outside the category names in ALLOWED_TEXT_DROPS;
  - a typing state whose target is in today's top 5 leaves the top 5, outside the
    broad prefixes in ALLOWED_TYPING_DROPS;
  - a name query doesn't put its page first, or a query in EXPECT_FIRST loses its lead,
    or one in EXPECT_SECTION_FIRST isn't led by that section as a result of its own;
  - two results of one query share a kind and id (the client keys rows by them);
  - a query in EXPECT_UNCORRECTED comes back typo-corrected;
  - where today's first result is a type or level page, a section result whose title
    isn't the query ranks above a collectible from today's top 5;
  - a titled walkthrough section isn't found by its own title, or a page gives two
    sections one anchor;
  - a search_vector column drifts from its expression, the SQL extraction and the
    Python twin in app/services/search_text.py disagree, a walkthrough nests text
    deeper than MAX_DEPTH, or the cycle rule indexes a base cycle;
  - a robustness check fails: a malformed or very large row errors in a stored
    expression, a malformed content errors where the statement reads its sections, an
    adversarial string strips links differently in SQL and in _strip_links, or a hostile
    query errors or builds tsquery text from what was typed;
  - a body-only hit near the top doesn't show a query word in its visible snippet;
  - a link to an item whose title its type page shows more than once carries
    another card's anchor;
  - the statement's server time misses the budget (p90 over TIMING_BUDGET_MS).

--timing runs EXPLAIN (ANALYZE) over TIMING_QUERIES for the search statement (and, where
the typo fallback runs, its vocabulary query and re-run); on dev it exits 1 when the p90
misses TIMING_BUDGET_MS. --prod also times the statements search ran before the rework
(copied below, verbatim), reads PROD_DATABASE_URL from server/.env, derives the app's
round trip from the 65 ms median DB time of a prod search cache miss before the rework
(OBSERVED_MISS_MEDIAN_MS), and passes only if the predicted p90 miss is within 100 ms.
The statement reads the stored search columns, so the database it times must have them.

--prod first checks that prod answers (scripts/db/check_connections.py, through the
Postgres tunnel), then reads through the scripts' own engine under a watchdog. Exits 2,
with the railway connect line to run, when prod doesn't answer or stops answering partway
through.
"""

import argparse
import asyncio
import itertools
import json
import logging
import os
import random
import re
import statistics
import subprocess
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

from dotenv import load_dotenv

SERVER_DIR = Path(__file__).resolve().parents[1]
BASELINE = SERVER_DIR / "scripts" / "search-baseline.json"
SEO = json.loads((SERVER_DIR.parent / "client" / "src" / "constants" / "seo.json").read_text(encoding="utf-8"))


def parse_args():
    # No abbreviations: --pro or --p would otherwise reach prod.
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter,
                                allow_abbrev=False)
    p.add_argument("--snapshot", action="store_true", help="record today's results in scripts/search-baseline.json")
    p.add_argument("--timing", action="store_true", help="only time the statements (EXPLAIN ANALYZE)")
    p.add_argument("--prod", action="store_true", help="with --timing: time on PROD_DATABASE_URL, read-only")
    args = p.parse_args()
    if args.prod and not args.timing:
        p.error("--prod only runs with --timing")
    if args.snapshot and args.timing:
        p.error("--snapshot runs on its own")
    return args


ARGS = parse_args()

# try/except import, as for the app below. check_connections imports nothing that reads
# DATABASE_URL, so it can come before the repoint.
try:
    from scripts.db import check_connections as cc
except ModuleNotFoundError:
    sys.path.insert(0, str(SERVER_DIR))
    from scripts.db import check_connections as cc

# --prod must repoint DATABASE_URL before the app imports below: app.db.database
# builds its engine from settings at import. The check comes first: a closed tunnel stops
# here with the line to run, and a URL its driver would misread stops before anything
# parses it, since a parser's error quotes the password.
if ARGS.prod:
    load_dotenv(SERVER_DIR / ".env")
    if not os.getenv("PROD_DATABASE_URL"):
        print("\033[31mPROD_DATABASE_URL not set in server/.env\033[0m")
        sys.exit(1)
    os.environ["DATABASE_URL"] = os.environ["PROD_DATABASE_URL"]
    cc.require(["Postgres"])

# try/except import instead of the usual sys.path.insert-then-import: on-save
# import sorters hoist app imports above the path bootstrap and break it.
try:
    from app.db.database import AsyncSessionLocal, engine
except ModuleNotFoundError:
    sys.path.insert(0, str(SERVER_DIR))
    from app.db.database import AsyncSessionLocal, engine

from sqlalchemy import text  # noqa: E402

from app.config.settings import settings  # noqa: E402
from app.core.colours import CYAN, GRAY, GREEN, RED, RESET, YELLOW  # noqa: E402
from app.core.navigation import NAV_LEVEL_SLUGS, url_type  # noqa: E402
from app.services import search, search_text  # noqa: E402

# Under --prod, read through the scripts' own engine under a watchdog: through a tunnel that
# freezes, a statement's cleanup can wait for good (scripts/db/seed_guard.py). The watchdog
# ends the run with the plain message instead.
WATCHDOG = None
if ARGS.prod:
    from scripts.db.seed_guard import (
        NO_ANSWER_SECONDS,
        Watchdog,
        seed_engine,
        seed_sessionmaker,
        watch_engine,
    )

    engine = seed_engine("search_eval")
    AsyncSessionLocal = seed_sessionmaker(engine)
    WATCHDOG = Watchdog(NO_ANSWER_SECONDS, cc.EXIT_UNREACHABLE,
                        lambda: cc.no_answer_message(["Postgres"], NO_ANSWER_SECONDS))
    watch_engine(engine, WATCHDOG)
    # The watchdog ends the process with os._exit, which drops anything still buffered:
    # flush every line, so the lines before a freeze survive a pipe or a file too.
    sys.stdout.reconfigure(line_buffering=True)

# ---------------------------------------------------------------------------
# What the evaluation asks
# ---------------------------------------------------------------------------

STAR = "\u2605"
# The brief's queries, from the prod logs.
BRIEF = [
    "nano", "outfits", "adam", "adam outfits", "adam skin", "new game plus", "ng+", "omnibolt",
    "memory in the", "memories in the doll", "sentinel 82", "obvlisiohn", "black learl", "boss challgen",
    "mystery bai", "box hunter", "amelia", "lily outfits", "lyle", "fishing", "eidos", "recruit passcode",
    "precious treasure",
]
# Log queries, review findings and the plan's examples.
EXTRA = [
    "eidos 7 camps", "xion documents", "wasteland supply boxes", "nest camp", "memory sticks", "exo spine",
    "ear rings", "sun glasses", "an e", "the l", "fishin", "memorystick xion", "camp locations xion",
    "glasses locations", "black pearl location", "ranged protection gear 2", "yorha no.2 type b uniform",
    "eidos 9, o you and mother", f"burst reovery gear {STAR * 3}", "supply box eidos 7", "passcode matrix 11",
    "eidos 7 collectibles", "xion collectibles", "side quest walkthrough", "walkthroughs", "nier dlc walkthrough",
    "boss challenge", "micro drive", "micro drivie", "side quests", "bulletin board", "nanosuit", "supplybox",
    "memory stick", "costumes", "skin", "appearance", "drone skin", "camp locations", "weapon upgrade",
    "cosmetics", "eve outfits", "black nano suit", "supply chest xion", "spire 4 memorystick", "new gam",
    "new game plu", "boss", "weapon core", "missable", "emilia", "platinum",
    # Sections as results, and the fishing pages (2026-10-21): every fish, every bait, the
    # quirks those pages exposed, "X guide", and the type names whose items sections must not
    # push out of the top 5.
    "goldfish", "mudskipper", "betta", "butterflyfish", "porcupinefish", "lobster", "flying fish", "triggerfish",
    "footballfish", "sea bass", "mackerel", "red seabream", "koi", "channel catfish", "salmon", "mahi-mahi",
    "halibut", "ocean sunfish", "sailfish", "pacific bluefin tuna", "arowana", "pirarucu", "great white shark",
    "whale shark", "dunkleosteus", "nikke dlc catches", "small shrimp", "wriggling insect", "fish slice",
    "special bait", "fantastic bait", "strange bait", "mystery bait", "fishing requests", "fishing data", "shark",
    "eidos 7 guide", "xion guide", "fishing guide", "the guide", "prayer meeting guide", "arowanna",
    "small shirmp", "lily", "camps", "memorystick", "overview", "starting the quest", "the plant",
    "drone upgrade",
]
# What the plan promises leads (plan section 5); None means no results at all.
EXPECT_FIRST = {
    "nano": "Nano Suits", "outfits": "Lily Outfits", "adam": "Adam Outfits", "adam outfits": "Adam Outfits",
    "adam skin": "Adam Outfits", "new game plus": "EVE Protocol", "ng+": "EVE Protocol",
    "omnibolt": "Scavenger Adam", "memory in the": "Memories in the Doll",
    "memories in the doll": "Memories in the Doll", "sentinel 82": "Sentinel 82's Report",
    "obvlisiohn": "Oblivion", "black learl": "Black Pearl", "boss challgen": "Boss: Scarlet",
    "mystery bai": "Bait and Fishing Data", "box hunter": "Supply Boxes", "amelia": None,
    "lily outfits": "Lily Outfits", "lyle": "Stolen Treasure", "fishing": "Fishing",
    "eidos": "Eidos 7", "recruit passcode": "Recruit Passcode Specialists", "precious treasure": "Precious Treasure",
    "side quests": "Side Quests", "bulletin board": "Bulletin Board Requests", "nanosuit": "Nano Suits",
    "supplybox": "Supply Boxes", "memory stick": "Memorysticks", "costumes": "Nano Suits",
    "appearance": "Drone Appearances", "camp locations": "Camps", "weapon upgrade": "Weapon Cores",
    "eve outfits": "Nano Suits", "drone skin": "Drone Appearances", "eidos 7 camps": "Eidos 7",
    "xion documents": "Xion", "walkthroughs": "Main Story", "side quest walkthrough": "Side Quests",
    "eidos 7 collectibles": "Eidos 7", "an e": "An Eye for an Eye, a Tooth for a Tooth",
    "the l": "The Last Wine", "fishin": "Fishing", "fish": "Fishing",
    f"burst reovery gear {STAR * 3}": f"Burst Recovery Gear {STAR * 3}",
    "yorha no.2 type b uniform": "YoRHa No.2 Type B Uniform", "black pearl location": "Black Pearl",
    "new gam": "EVE Protocol", "missable": None, "emilia": None,
    # 2026-10-21. A value starting "/" is the exact link the first result must have; a
    # title also matches a walkthrough row by its page's title.
    "mystery bait": "Bait and Fishing Data", "eidos 7 guide": "Eidos 7", "xion guide": "Xion",
    "fishing guide": "Fishing", "drone upgrade": "Drone Upgrade Modules",
    "crater supply camp": "/collectibles/camps#crater-supply-camp", "lily": "Lily Outfits",
    "memorystick": "Memorysticks",
}
# Queries a walkthrough section must lead, as a result of its own: the link it must have.
# (Before sections were results, the page's row could carry the same link.)
EXPECT_SECTION_FIRST = {
    "goldfish": "/walkthroughs/fishing/all-fish#goldfish", "arowana": "/walkthroughs/fishing/all-fish#arowana",
    "arowanna": "/walkthroughs/fishing/all-fish#arowana", "porcupinefish": "/walkthroughs/fishing/all-fish#porcupinefish",
    "channel catfish": "/walkthroughs/fishing/all-fish#channel-catfish",
    "halibut": "/walkthroughs/fishing/all-fish#halibut", "whale shark": "/walkthroughs/fishing/all-fish#whale-shark",
    "small shrimp": "/walkthroughs/fishing/bait-and-fishing-data#small-shrimp",
    "wriggling insect": "/walkthroughs/fishing/bait-and-fishing-data#wriggling-insect",
    "fish slice": "/walkthroughs/fishing/bait-and-fishing-data#fish-slice",
    "special bait": "/walkthroughs/fishing/bait-and-fishing-data#special-bait",
    "fantastic bait": "/walkthroughs/fishing/bait-and-fishing-data#fantastic-bait",
    "strange bait": "/walkthroughs/fishing/bait-and-fishing-data#strange-bait",
    "fishing requests": "/walkthroughs/fishing/fishing-overview#the-fishing-requests",
}
SHORT_CATEGORY_NAMES = [
    ("nier", "nier-dlc"), ("nikke", "nikke-dlc"), ("nier dlc", "nier-dlc"), ("nikke dlc", "nikke-dlc"),
    ("side quest", "side-quests"), ("bulletin board request", "bulletin-board-requests"), ("main story", "main-story"),
]
# Prefixes that dozens of equally good titles share: their targets may leave the top 5.
ALLOWED_TYPING_DROPS = {"lo", "legi", "legio", "centr", "fi"}
# Category names: the category's own walkthroughs now fill the top 20, ahead of pages
# that only mention it, so those pages may leave it.
ALLOWED_TEXT_DROPS = {"side quests", "side quest", "bulletin board", "bulletin board request", "bulletin board requests"}
# Queries the typo fallback must leave as typed: nothing on the site is spelled like them.
EXPECT_UNCORRECTED = {"platinum", "missable", "amelia", "emilia", "box hunter"}
TIMING_QUERIES = BRIEF + [
    "boss", "eve", "xion", "supply", "the", "su", "bo", "ma", "st", "fi", "ad",
    "beta core eidos seven", "spire 4 memorystick upper", "black nano suit red", "weapon core crater hidden",
]
# Dev server time, p90. The plan's 12 ms came from a prototype estimate that left out
# reading the stored vectors (about 5 ms); the statement as built measured p90 11.9 to
# 13.0 ms on a quiet dev database (2026-10-18), so the budget was 15. Section results
# (2026-10-21) cost about 2 ms more: 11.9 to 13.4 ms run on their own, and 12.4 to 15.5
# inside a full check, where this gate runs. Most of it is reading the content of every
# walkthrough a broad word like "supply" matches, for its section titles (about 2.7 ms
# on "supply", 0.5 on a specific query). So the budget is 17 (2026-10-22), 1.5 above a
# full check's p90. The real latency gates are the prod timing gate below and a
# post-deploy check of live search-miss times, both unchanged.
TIMING_BUDGET_MS = 17.0
VISIBLE = 44          # snippet characters the narrowest results row shows
PAGE_KINDS = {"type", "walkthrough_type", "level"}
ALIAS_WORDS = ("outfit", "skin", "suit", "costume", "new game", "ng+", "ng++", "appearance", "drone")


def fam(kind):
    return "item" if kind in ("collectibles", "upgrades", "cosmetics") else kind


def normalize(q):
    """The router's normalization: the rework's normalize_search_query, or strip().lower() before it."""
    fn = getattr(search, "normalize_search_query", None)
    return fn(q) if fn else q.strip().lower()


async def ask(q, limit=20):
    """Search as the router does, in a fresh read-only session: (rows, corrected)."""
    nq = normalize(q)
    if not nq:
        return [], None
    async with AsyncSessionLocal() as s:
        await s.execute(text("SET TRANSACTION READ ONLY"))
        out = await search._execute_search(s, nq, limit)
    results, corrected = out if isinstance(out, tuple) else (out, None)
    return [{"kind": r.kind, "id": r.id, "title": r.title, "url": r.navigation_url,
             "snippet": r.snippet, "score": r.score} for r in results], corrected


async def build_queries(s):
    """Every query the evaluation asks, with its groups and targets. Deterministic for
    a given database; the snapshot stores the set, so later runs ask the same one."""
    queries = {}

    def add(q, group, target=None):
        q = " ".join(q.split()).lower()
        if not 2 <= len(q) <= 100:
            return
        entry = queries.setdefault(q, {"groups": [], "targets": []})
        if group not in entry["groups"]:
            entry["groups"].append(group)
        if target and target not in entry["targets"]:
            entry["targets"].append(target)

    def target(family=None, title=None, url=None):
        return {k: v for k, v in (("family", family), ("title", title), ("url", url)) if v is not None}

    for q in BRIEF:
        add(q, "brief")
    for q in EXTRA:
        add(q, "extra")

    types = (await s.execute(text(
        "SELECT id, name, slug, coalesce(category_group, 'collectibles') FROM collectible_types ORDER BY id"))).all()
    display = {slug: " ".join(w.capitalize() for w in slug.split("-")) for _, _, slug, _ in types}
    for _, name, slug, group in types:
        for q in (display[slug], name):
            add(q, "name", target("type", url=f"/{group}/{slug}"))
    for slug, entry in SEO["walkthroughTypes"].items():
        add(entry["name"], "name", target("walkthrough_type", url=f"/walkthroughs/{slug}"))
    for q, slug in SHORT_CATEGORY_NAMES:
        add(q, "name", target("walkthrough_type", url=f"/walkthroughs/{slug}"))

    item_titles = sorted({r[0] for r in (await s.execute(text("SELECT DISTINCT title FROM collectibles"))).all()})
    walkthrough_titles = [r[0] for r in (await s.execute(text("SELECT title FROM walkthroughs ORDER BY id"))).all()]
    level_names = [r[0] for r in (await s.execute(text("SELECT name FROM levels ORDER BY display_order"))).all()
                   if r[0].lower().replace(" ", "-") in NAV_LEVEL_SLUGS]

    # Title sweep: every distinct title as a query.
    for title in item_titles:
        add(title, "title", target("item", title))
    for title in walkthrough_titles:
        add(title, "title", target("walkthrough", title))
    for name in level_names:
        add(name, "title", target("level", name))

    # Typing: every prefix of 247 titles as it is typed.
    typing_targets = ([("walkthrough", t) for t in walkthrough_titles]
                      + [("type", display[slug]) for _, _, slug, _ in types]
                      + [("walkthrough_type", e["name"]) for e in SEO["walkthroughTypes"].values()]
                      + [("level", n) for n in level_names]
                      + [("item", t) for t in random.Random(7).sample(item_titles, 120)])
    for family, title in typing_targets:
        full = title.lower()
        for n in range(2, len(full) + 1):
            if n < len(full) and full[n - 1] == " ":
                continue
            add(full[:n], "typing", target(family, title))

    # One swapped or dropped letter in the longest word of 60 titles.
    all_titles = sorted(set(item_titles) | set(walkthrough_titles))
    for i, title in enumerate(random.Random(11).sample(all_titles, 60)):
        words = re.findall(r"[A-Za-z]{5,}", title)
        if not words:
            continue
        w = max(words, key=len)
        j = 1 + (i % (len(w) - 2))
        typo = w[:j] + w[j + 1] + w[j] + w[j + 2:] if i % 2 == 0 else w[:j] + w[j + 1:]
        add(title.replace(w, typo, 1), "typo", target(None, title))

    # The regressions review's families (same seeds and sources as that review).
    for q in ["emilia", "fi", "boss", "fishi", "divin", "boxes", "memories", "eve", "fihsing", "sentinal 82",
              "oblivon", "blak pearl", "scarlett", "lilly outfits", "in the", "eve's", "mystery b", "newgame+",
              "ng++", "ng +", "ng plus", "appearance", "skin", "skin suit", "omni", "mystery bait", "challgen"]:
        add(q, "plan-misc")
    for t in walkthrough_titles:
        add(re.findall(r"[^\W_]+", t)[0], "wt-firstword", target(None, t))
    for t in random.Random(3616).sample(item_titles, 200):
        add(t, "coll-random", target(None, t))
    for q in ["eidos 7 camp", "xion documents", "black nano suit", "adam outfit chameleon", "lily off duty",
              "boss scarlet", "gear crit", "beta core eidos", "spire 4 memorystick", "fishing rod", "strange bait",
              "raven suit", "skin suit", "drone skin", "eve outfits", "eve costume", "wasteland camp",
              "great desert supply chest", "matrix 11 document", "xion can", "nest camp", "eidos 9 body core",
              "lily outfit", "adam costume", "drone appearance pack", "earrings ruby", "sunglasses", "hair style",
              "hairstyle kasim", "exospine", "exo spine", "tumbler", "drone upgrade", "body core xion",
              "supply chest altess", "memory sticks", "passcode", "nier", "nikke", "dlc", "emil", "emil shop",
              "volt shop", "stellar tears", "stellar tear", "fish", "bait", "camp", "oasis", "data bank", "scarlet",
              "boss", "main story", "side quest", "bulletin board request", "nier dlc", "nikke dlc", "levels",
              "collectibles", "cosmetics", "upgrades"]:
        add(q, "mix")
    candidates = [t for t in all_titles if len(re.sub(r"[^a-z]", "", t.lower())) >= 5
                  and re.fullmatch("[A-Za-z0-9 '\u2019:,!?.\\-&/()\u2605]+", t)]
    rt = random.Random(42)
    for t in rt.sample(candidates, 60):
        low = t.lower()
        idx = [i for i in range(len(low) - 1) if low[i].isalpha() and low[i + 1].isalpha() and low[i] != low[i + 1]]
        i = rt.choice(idx)
        add(low[:i] + low[i + 1] + low[i] + low[i + 2:], "typo-swap", target(None, t))
        idx2 = [i for i in range(len(low)) if low[i].isalpha()]
        j = rt.choice(idx2)
        add(low[:j] + low[j + 1:], "typo-drop", target(None, t))
    for q in ["memory stick", "memory sticks", "exo spine", "exo spines", "hair style", "hair styles", "ear rings",
              "ear ring", "sun glasses", "eye patch", "hyper tube", "pass code", "pass codes", "nanosuit", "nanosuits",
              "supplybox", "supplychest", "weaponcore", "bodycore", "betacore", "drone upgrades", "memorystick",
              "hairstyle", "eyepatch", "hypertube"]:
        add(q, "compound")
    rows = (await s.execute(text("""
        SELECT c.title, ct.name FROM collectibles c
        JOIN collectible_type_mappings m ON m.collectible_id = c.id JOIN collectible_types ct ON ct.id = m.type_id
        WHERE ct.slug NOT IN ('supply-boxes', 'supply-chests', 'beta-cores', 'body-cores', 'weapon-cores',
                              'drone-upgrade-modules', 'tumbler-expansion-modules')
        ORDER BY c.title, ct.name"""))).all()
    for title, type_name in random.Random(99).sample(rows, 80):
        first = re.findall(r"[^\W_]+", title)[0]
        add(f"{type_name} {title}", "title+type", target(None, title))
        add(f"{title} {type_name}", "title+type", target(None, title))
        if len(first) >= 3 and first.lower() not in type_name.lower():
            add(f"{type_name} {first}", "type+word", target(None, title))
    worded = [t for t in all_titles if re.search(r"\b(gear|camp|earrings|glasses|exospine|pack)\b", t.lower())
              and re.fullmatch("[A-Za-z0-9 '\\-\u2605]+", t)]
    rw = random.Random(5)
    for t in rw.sample(worded, 50):
        low = t.lower()
        w0 = low.split()[0]
        if len(w0) < 4:
            continue
        i = rw.randrange(len(w0) - 1)
        if w0[i] != w0[i + 1]:
            add(w0[:i] + w0[i + 1] + w0[i] + w0[i + 2:] + low[len(w0):], "typeword-typo", target(None, t))

    # Level x type: each page level x each type it holds x three phrasings.
    held = defaultdict(set)
    for type_id, level in (await s.execute(text("""
            SELECT DISTINCT m.type_id, lv.name FROM collectibles c
            JOIN collectible_type_mappings m ON m.collectible_id = c.id
            JOIN locations loc ON loc.id = c.location_id JOIN levels lv ON lv.id = loc.level_id"""))).all():
        held[level].add(type_id)
    for level in level_names:
        for type_id, name, slug, _ in types:
            if type_id in held[level]:
                for q in (f"{level} {slug.replace('-', ' ')}", f"{level} {name}", f"{slug.replace('-', ' ')} {level}"):
                    add(q, "grid", target("level", level))
    return queries


# ---------------------------------------------------------------------------
# Snapshot
# ---------------------------------------------------------------------------

FTS_SQL = text("""
    SELECT CASE WHEN x.k = 'walkthrough' THEN to_tsvector('english', x.t || ' ' || coalesce(x.sn, ''))
                ELSE to_tsvector('english', x.t) END @@ plainto_tsquery('english', :q)
    FROM unnest(CAST(:k AS text[]), CAST(:t AS text[]), CAST(:sn AS text[])) WITH ORDINALITY AS x(k, t, sn, o)
    ORDER BY x.o""")


class _ErrorLog(logging.Handler):
    """The pre-rework search logs a failing source and carries on with partial results;
    a snapshot taken through such a failure would be wrong, so it is refused."""

    def __init__(self):
        super().__init__(logging.ERROR)
        self.messages = []

    def emit(self, record):
        self.messages.append(record.getMessage())


async def snapshot():
    errors = _ErrorLog()
    logging.getLogger("app.services.search").addHandler(errors)
    async with AsyncSessionLocal() as s:
        await s.execute(text("SET TRANSACTION READ ONLY"))
        queries = await build_queries(s)
    print(f"{CYAN}Asking {len(queries)} queries of the search as it stands{RESET}")
    started = time.perf_counter()
    for n, (q, entry) in enumerate(queries.items(), 1):
        rows, corrected = await ask(q)
        top = rows[:5]
        async with AsyncSessionLocal() as s:
            await s.execute(text("SET TRANSACTION READ ONLY"))
            fts = [bool(v) for (v,) in (await s.execute(FTS_SQL, {
                "q": q, "k": [r["kind"] for r in top], "t": [r["title"] for r in top],
                "sn": [r["snippet"] or "" for r in top]})).all()] if top else []
        entry["before"] = [[r["kind"], r["id"], r["title"], r["url"], fts[i] if i < len(fts) else None]
                           for i, r in enumerate(rows)]
        entry["before_corrected"] = corrected
        if n % 500 == 0:
            print(f"  {n} / {len(queries)}")
    if errors.messages:
        print(f"{RED}[ERROR]{RESET} the search logged {len(errors.messages)} error(s); snapshot not written:")
        for m in errors.messages[:10]:
            print(f"  {m}")
        return 1
    head = subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True,
                          cwd=SERVER_DIR).stdout.strip()
    BASELINE.write_text(json.dumps({
        "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "git_head": head,
        "database": cc.mask("Postgres", settings.DATABASE_URL),
        "queries": queries,
    }, ensure_ascii=False), encoding="utf-8")
    print(f"{GREEN}Wrote {BASELINE.relative_to(SERVER_DIR)}{RESET}: {len(queries)} queries in "
          f"{time.perf_counter() - started:.0f} s (git {head})")
    return 0


# ---------------------------------------------------------------------------
# Check
# ---------------------------------------------------------------------------

# Walkthrough pages by title and titles by page, filled by load_pages(): a section result
# stands for its page wherever results are compared.
PAGES = {"by_title": {}, "title_of": {}}


async def load_pages(s):
    for title, mission_type, slug in (await s.execute(text("SELECT title, mission_type, slug FROM walkthroughs"))).all():
        url = f"/walkthroughs/{url_type(mission_type)}/{slug}"
        PAGES["by_title"].setdefault(title.lower(), set()).add(url)
        PAGES["title_of"][url] = title


def page_url(url):
    return url.partition("#")[0]


def _parts(row):
    """(kind, id, title, url) of a result row, dict or snapshot list."""
    return (row["kind"], row["id"], row["title"], row["url"]) if isinstance(row, dict) else tuple(row[:4])


def ident(row):
    """What a row is when asking whether it's still there: a walkthrough row, page or
    section, is its page; anything else its family and title."""
    kind, _, title, url = _parts(row)
    return ("walkthrough", page_url(url)) if fam(kind) == "walkthrough" else (fam(kind), title.lower())


def matches(row, tgt):
    """Whether a result row (dict or snapshot list) is the target. A walkthrough row, page
    or section, is its page: it meets a walkthrough's title, never a collectible's that a
    section happens to share."""
    kind, _, title, url = _parts(row)
    if "url" in tgt:
        return url == tgt["url"]
    if fam(kind) == "walkthrough":
        return tgt.get("family") in (None, "walkthrough") and \
            page_url(url) in PAGES["by_title"].get(tgt["title"].lower(), ())
    return (tgt.get("family") in (None, fam(kind))) and title.lower() == tgt["title"].lower()


def names_a_word(text, q):
    """Whether `text` holds a word of the query where a word starts (its first four
    letters, as visible_word reads a snippet)."""
    return any(re.search(r"(?<![^\W_])" + re.escape(w[:4]), text.lower())
               for w in re.findall(r"[^\W_]+", q.lower()) if len(w) >= 2)


def rank(rows, tgt):
    return next((i for i, r in enumerate(rows) if matches(r, tgt)), None)


def target_groups(q, tgt, groups):
    """The groups one target belongs to. A query can sit in several groups, and the
    snapshot keeps its targets together, so each is told apart by its shape."""
    found = set()
    title = tgt.get("title", "").lower()
    if "url" in tgt:
        return {"name"} & set(groups)
    if tgt.get("family"):
        if "title" in groups and q == title:
            found.add("title")
        if "typing" in groups and title.startswith(q):
            found.add("typing")
        if "grid" in groups and tgt["family"] == "level" and q != title:
            found.add("grid")
    else:
        found |= set(groups) - {"brief", "extra", "name", "title", "typing", "grid"}
    return found


def visible_word(snippet, q, corrected):
    head = (snippet or "")[:VISIBLE].lower()
    words = [w for w in re.findall(r"[^\W_]+", (corrected or q).lower()) if len(w) >= 2]
    return any(w[:4] in head for w in words) or any(a in head for a in ALIAS_WORDS)


def fmt(rows, n=5):
    """Titles, a section result as "Section (Page)"."""
    def name(row):
        _, rid, title, url = _parts(row)
        return f"{title} ({PAGES['title_of'].get(page_url(url), '?')})" if rid < 0 else title
    return "; ".join(name(r) for r in rows[:n]) or "-"


def lead_is(row, want):
    """EXPECT_FIRST: a link starting "/" must be the row's exactly; a title is the row's
    own or, for a walkthrough row, its page's."""
    if want.startswith("/"):
        return row["url"] == want
    return want == row["title"] or (fam(row["kind"]) == "walkthrough"
                                    and want == PAGES["title_of"].get(page_url(row["url"])))


async def stored_column_checks():
    """Column tags and contents, the twin, the depth guard and the cycle rule."""
    problems = []
    st = search_text
    async with AsyncSessionLocal() as s:
        await s.execute(text("SET TRANSACTION READ ONLY"))
        states = {r.table_name: r for r in (await s.execute(text(st.COLUMN_STATE_SQL))).all()}
        for table, expr in st.SEARCH_COLUMNS.items():
            state = states.get(table)
            if not state or not state.present:
                problems.append(f"{table}.search_vector is missing (run the migration)")
                continue
            if state.tag != st.column_tag(expr):
                problems.append(f"{table}.search_vector is stale: tag {state.tag!r}, expected {st.column_tag(expr)!r}")
            differing = (await s.execute(text(
                f"SELECT count(*) FROM {table} WHERE search_vector IS DISTINCT FROM ({expr})"))).scalar()
            if differing:
                problems.append(f"{table}: {differing} row(s) differ from the expression")

        # The twin, on every real row.
        bad = 0
        for wid, title, content, objectives, rewards, sql in (await s.execute(text(
                f"SELECT id, title, content, objectives, rewards, ({st._WALKTHROUGH_TEXT}) FROM walkthroughs"))).all():
            want = [st.strip_links(x) for x in st.walkthrough_strings(content, objectives, rewards)]
            if Counter(sql) != Counter(want):
                bad += 1
                problems.append(f"twin mismatch: walkthrough {title!r}")
            for path in st.too_deep(content):
                problems.append(f"too deep: walkthrough {title!r} at {path}")
        for cid, description, sql in (await s.execute(text(
                f"SELECT id, description, ({st._DESCRIPTION_TEXT}) FROM collectibles"))).all():
            if Counter(sql) != Counter(st.strip_links(x) for x in st.description_strings(description)):
                bad += 1
                problems.append(f"twin mismatch: collectible {cid}")

        # The twin, on generated nested shapes the real data doesn't have yet.
        corpus = nested_corpus()
        for content, objectives, rewards in corpus:
            sql = (await s.execute(text(
                f"SELECT ({st._WALKTHROUGH_TEXT}) FROM (SELECT CAST(:c AS jsonb) AS content, "
                f"CAST(:o AS jsonb) AS objectives, CAST(:r AS jsonb) AS rewards) t"),
                {"c": json.dumps(content), "o": json.dumps(objectives), "r": json.dumps(rewards)})).scalar()
            back = (await s.execute(text("SELECT CAST(:c AS jsonb), CAST(:o AS jsonb), CAST(:r AS jsonb)"),
                                    {"c": json.dumps(content), "o": json.dumps(objectives),
                                     "r": json.dumps(rewards)})).one()
            want = [st.strip_links(x) for x in st.walkthrough_strings(*back)]
            if Counter(sql) != Counter(want):
                problems.append(f"twin mismatch on a generated shape: {json.dumps(content)[:200]}")
                break

        # The cycle rule: only a cycle other than the base one gains a C lexeme.
        for cycle, expect in (("Base", False), ("NG", False), ("NG+", True), ("NG++", True), ("DLC", True)):
            lexemes = (await s.execute(text(
                f"SELECT tsvector_to_array(ts_filter(({st.COLLECTIBLE_VECTOR}), '{{c}}')) FROM "
                f"(SELECT 'x'::text AS title, '{{}}'::jsonb AS description, CAST(:cycle AS text) AS cycle) t"),
                {"cycle": cycle})).scalar()
            if bool(lexemes) != expect:
                problems.append(f"cycle {cycle!r}: C lexemes {lexemes}, expected {'some' if expect else 'none'}")
    print(f"{CYAN}Stored columns{RESET}: tags and contents checked, twin on every real row and "
          f"{len(corpus)} generated shapes, depth guard, cycle rule: "
          f"{GREEN + 'all hold' + RESET if not problems else RED + str(len(problems)) + ' problem(s)' + RESET}")
    return problems


def nested_corpus(n=400, seed=2026):
    """Deterministic walkthrough shapes: denied keys at every depth, structured fields,
    arrays of arrays, non-string leaves, and content that isn't an array at all."""
    rnd = random.Random(seed)
    keys = list(search_text.SECTION_DENY) + ["text", "tip", "warning", "section_title", "fish", "name",
                                             "bait", "spots", "rows", "boss_info", "key_attacks", "notes", ""]
    cjk = "".join(map(chr, (0x4E2D, 0x6587)))
    words = ["Trout", "Oasis [[/a|Lake]] side", "[[x|y]]", "plain", 'q"uote', "back\\slash", "", "mixed " + cjk,
             "fish " + chr(0x1F41F), "[[unclosed", "a]]b", "[[p|q]] and [[r|s]]"]

    def value(depth):
        roll = rnd.random()
        if depth > 6 or roll < 0.35:
            return rnd.choice(words)
        if roll < 0.45:
            return rnd.choice([None, 0, 1.5, True, False])
        if roll < 0.7:
            return [value(depth + 1) for _ in range(rnd.randint(0, 4))]
        return {rnd.choice(keys): value(depth + 1) for _ in range(rnd.randint(0, 4))}

    out = []
    for _ in range(n):
        content = rnd.choice([
            None, "text", 5, {"text": "x"},
            [value(0) for _ in range(rnd.randint(0, 4))],
            [{rnd.choice(keys): value(0) for _ in range(rnd.randint(1, 6))} for _ in range(rnd.randint(1, 4))],
        ])
        objectives = rnd.choice([None, "x", {"a": "b"}, [value(1) for _ in range(rnd.randint(0, 3))]])
        rewards = rnd.choice([None, 7, [value(1) for _ in range(rnd.randint(0, 3))]])
        out.append((content, objectives, rewards))
    return out


# ---------------------------------------------------------------------------
# Robustness: shapes, links and queries that no real row or log holds yet
# ---------------------------------------------------------------------------

# Built with chr(), so no unusual character sits in this file as itself.
UNICODE_BITS = [
    chr(0x4E2D) + chr(0x6587),                    # CJK
    chr(0x1F41F),                                 # an emoji
    chr(0x1F468) + chr(0x200D) + chr(0x1F469),    # a joined emoji sequence
    "e" + chr(0x301),                             # a combining accent
    chr(0x5D0) + chr(0x5D1) + chr(0x200F),        # Hebrew and a right-to-left mark
    chr(0xFF4E) + chr(0xFF41) + chr(0xFF4E) + chr(0xFF4F),   # full-width "nano"
    chr(0xA0), chr(0x3000), chr(0x200B), chr(0xAD), chr(0x2028), chr(0xFEFF),
    chr(0x3B2), STAR, chr(0x2019), chr(0x2026),
]
# Text and jsonb hold every control character but NUL, which Postgres refuses.
CONTROL_BITS = [chr(1), chr(9), chr(10), chr(13), chr(0x1F), chr(0x7F)]
NULL = object()   # a JSON column holding SQL NULL, where None is the JSON value null

_ROW_COLUMNS = {
    "walkthroughs": ("title", "subtitle", "available_after", "content", "objectives", "rewards"),
    "collectibles": ("title", "description", "cycle"),
}
_JSON_COLUMNS = {"content", "objectives", "rewards", "description"}


def _rows_sql(table, select):
    """`select` over rows passed as one text[] per column, under the table's own column
    names and types, so the stored expressions evaluate unchanged."""
    columns = _ROW_COLUMNS[table]
    typed = ", ".join(f"CAST({c} AS jsonb) AS {c}" if c in _JSON_COLUMNS else c for c in columns)
    arrays = ", ".join(f"CAST(:{c} AS text[])" for c in columns)
    return text(f"SELECT {select} FROM (SELECT ord, {typed} FROM unnest({arrays}) "
                f"WITH ORDINALITY AS u({', '.join(columns)}, ord)) t ORDER BY ord")


def _rows_params(table, rows):
    def cell(column, value):
        if value is NULL or column not in _JSON_COLUMNS:
            return None if value is NULL else value
        return json.dumps(value)
    return {c: [cell(c, row[c]) for row in rows] for c in _ROW_COLUMNS[table]}


def _first_line(exc):
    return (str(exc).strip().splitlines() or [type(exc).__name__])[0][:200]


def malformed_rows(n=1500, seed=2027):
    """Deterministic walkthrough and collectible rows in every shape a seed file could
    give them: denied keys at every depth, arrays of arrays, non-string leaves, unicode,
    control characters, escapes and links, SQL NULL and JSON null, and columns that
    aren't the type the code expects."""
    rnd = random.Random(seed)
    keys = list(search_text.SECTION_DENY) + ["text", "tip", "warning", "section_title", "fish", "name", "bait",
                                             "spots", "boss_info", "key_attacks", "content", "items", "", " ", "0"]
    bits = ["Trout", "plain words", "[[/a|Lake]]", "[[x|y]] and [[p|q]]", "[[unclosed", "a]]b", "|",
            "[[a|b|c]]", '"', chr(92), ""] + UNICODE_BITS + CONTROL_BITS

    def string():
        return "".join(rnd.choice(bits) for _ in range(rnd.randint(0, 5)))

    def value(depth):
        roll = rnd.random()
        if depth > 7 or roll < 0.35:
            return string()
        if roll < 0.47:
            return rnd.choice([None, 0, -1, 2 ** 70, 1.5, 1e300, True, False])
        if roll < 0.72:
            return [value(depth + 1) for _ in range(rnd.randint(0, 4))]
        return {rnd.choice(keys): value(depth + 1) for _ in range(rnd.randint(0, 4))}

    def anything():
        return rnd.choice([NULL, None, string(), 0, True, value(0), [value(1) for _ in range(rnd.randint(0, 4))]])

    walkthroughs = [dict(
        title=string(), subtitle=rnd.choice([None, string()]), available_after=rnd.choice([None, string()]),
        content=rnd.choice([anything(), [{rnd.choice(keys): value(0) for _ in range(rnd.randint(1, 6))}
                                         for _ in range(rnd.randint(1, 5))]]),
        objectives=anything(), rewards=anything(),
    ) for _ in range(n)]
    collectibles = [dict(
        title=string(),
        description=rnd.choice([anything(), {rnd.choice(["type", "content", "items", "x"]): value(1)
                                             for _ in range(rnd.randint(0, 3))}]),
        cycle=rnd.choice([None, "", "Base", "NG", "NG+", "NG++", "DLC", "base", "ng", string()]),
    ) for _ in range(n)]
    return walkthroughs, collectibles


def large_rows():
    """Rows far bigger than any real one (the largest walkthrough vector is 34 KB). Each
    stays under Postgres's 1 MB of lexeme text per tsvector, which no guard covers."""
    rnd = random.Random(2028)
    vocab = ["".join(rnd.choice("abcdefghijklmnopqrstuvwxyz") for _ in range(rnd.randint(3, 9))) for _ in range(500)]

    def words(n):
        return " ".join(rnd.choice(vocab) for _ in range(n))

    w = dict(title="Large", subtitle=None, available_after=None, content=[], objectives=None, rewards=None)
    return [
        ("1,500 sections of 40 words", "walkthroughs",
         dict(w, content=[{"section_title": words(3), "text": words(40), "order": i} for i in range(1500)])),
        ("a 200 KB string", "walkthroughs", dict(w, content=[{"text": words(30000)}])),
        ("10,000 objectives", "walkthroughs", dict(w, objectives=[words(1) for _ in range(10000)])),
        ("10,000 links in one string", "walkthroughs", dict(w, content=[{"text": "[[/p|label]] " * 10000}])),
        ("a 64 KB run of [[", "walkthroughs", dict(w, content=[{"text": "[[" * 32768}], available_after="[[" * 32768)),
        ("a 100 KB description with 5,000 items", "collectibles",
         dict(title="Large", cycle="NG+",
              description={"type": "list", "content": words(15000), "items": [words(1) for _ in range(5000)]})),
    ]


async def shape_checks(s):
    """Malformed rows through both stored expressions: no errors, no NULL vector, and
    the twin returns exactly the SQL's strings. Then the large rows, timed."""
    st, problems = search_text, []
    walkthroughs, collectibles = malformed_rows()
    tables = {
        "walkthroughs": (walkthroughs, st._WALKTHROUGH_TEXT,
                         lambda r: st.walkthrough_strings(r["content"], r["objectives"], r["rewards"])),
        "collectibles": (collectibles, st._DESCRIPTION_TEXT, lambda r: st.description_strings(r["description"])),
    }
    for table, (rows, strings, twin) in tables.items():
        columns, vector = _ROW_COLUMNS[table], st.SEARCH_COLUMNS[table]
        for start in range(0, len(rows), 250):
            batch = rows[start:start + 250]
            try:
                async with s.begin_nested():
                    got = (await s.execute(_rows_sql(table, f"({vector}) IS NULL, ({strings}), {', '.join(columns)}"),
                                           _rows_params(table, batch))).all()
            except Exception as exc:
                failing = []
                for row in batch:   # name the rows that fail on their own
                    try:
                        async with s.begin_nested():
                            await s.execute(_rows_sql(table, f"({vector})"), _rows_params(table, [row]))
                    except Exception as row_exc:
                        failing.append(f"{table} row {repr(row)[:160]}: {_first_line(row_exc)}")
                problems += failing[:3] or [f"{table}: a batch of generated rows failed: {_first_line(exc)}"]
                continue
            for null_vector, sql, *back in got:
                row = dict(zip(columns, back))
                if null_vector:
                    problems.append(f"{table}: NULL search_vector for {repr(row)[:160]}")
                if Counter(sql) != Counter(st.strip_links(x) for x in twin(row)):
                    problems.append(f"{table}: twin mismatch for {repr(row)[:160]}")

    timeout = (await s.execute(text("SHOW statement_timeout"))).scalar()
    slowest, large = (0.0, ""), large_rows()
    for label, table, row in large:
        started = time.perf_counter()
        try:
            async with s.begin_nested():
                await s.execute(_rows_sql(table, f"({st.SEARCH_COLUMNS[table]}) IS NULL"), _rows_params(table, [row]))
        except Exception as exc:
            problems.append(f"large row ({label}): {_first_line(exc)}")
            continue
        slowest = max(slowest, (time.perf_counter() - started, label))
    print(f"{CYAN}Shapes{RESET}: {len(walkthroughs)} walkthrough and {len(collectibles)} collectible rows of malformed "
          f"shapes through both expressions, twin compared; {len(large)} large rows, slowest "
          f"{slowest[0]:.2f} s ({slowest[1]}) against a statement timeout of {timeout}: "
          f"{GREEN + 'all hold' + RESET if not problems else RED + str(len(problems)) + ' problem(s)' + RESET}")
    return problems


def link_corpus(seed=2029):
    """Strings that try to make the JSON link pattern cross a string boundary or misread
    an escape: every string of up to 7 characters over [ ] | " \\ a, then random arrays
    of fragments. Short on purpose: _strip_links is quadratic on long runs of "[["."""
    alphabet = ["[", "]", "|", '"', chr(92), "a"]
    singles = ["".join(p) for n in range(1, 8) for p in itertools.product(alphabet, repeat=n)]
    rnd = random.Random(seed)
    fragments = alphabet + [
        "[[", "]]", "[[a|b]]", "[[p|", "|q]]", "[[x|y]] z", "[[[a|b]]]", "]]]", "[[/levels/eidos-7|Eidos 7]]",
        chr(92) * 2, chr(92) + '"', '"' + chr(92), "[[a" + chr(92), chr(92) + "|b]]", chr(10), chr(9), chr(1),
        chr(0x4E2D), chr(0x1F41F),
    ]
    arrays = [["".join(rnd.choice(fragments) for _ in range(rnd.randint(0, 5))) for _ in range(rnd.randint(2, 6))]
              for _ in range(20000)]
    return singles, arrays


async def link_checks(s):
    """Both SQL link patterns against _strip_links, string for string: the text one on
    each string, the JSON one on each string alone and on whole arrays, where a match
    must never run from one string into the next."""
    st, problems = search_text, []
    singles, arrays = link_corpus()
    texts = singles + [x for a in arrays for x in a]
    got = (await s.execute(text(
        f"SELECT regexp_replace(s, {st.WIKILINK_TEXT}), {st._strings(['jsonb_build_array(s)'])} "
        "FROM unnest(CAST(:s AS text[])) WITH ORDINALITY AS u(s, ord) ORDER BY ord"), {"s": texts})).all()
    for raw, (by_text, by_json) in zip(texts, got):
        want = search._strip_links(raw)
        if by_text != want or by_json != [want]:
            problems.append(f"link pattern differs on {raw!r}: text {by_text!r}, json {by_json!r}, want {want!r}")
    got = (await s.execute(text(
        f"SELECT {st._strings(['a'])} FROM jsonb_array_elements(CAST(:a AS jsonb)) WITH ORDINALITY AS u(a, ord) "
        "ORDER BY ord"), {"a": json.dumps(arrays)})).scalars().all()
    for raw, by_json in zip(arrays, got):
        want = [search._strip_links(x) for x in raw]
        if by_json != want:
            problems.append(f"JSON link pattern differs on {raw!r}: {by_json!r}, want {want!r}")
    print(f"{CYAN}Links{RESET}: {len(texts)} strings through both patterns and {len(arrays)} arrays through the "
          f"JSON one, against _strip_links: "
          f"{GREEN + 'all equal' + RESET if not problems else RED + str(len(problems)) + ' difference(s)' + RESET}")
    return problems[:40]


_WORD = r"[^\W_]+"
_TSQUERY_TEXT = re.compile(rf"'{_WORD}'(?: (?:&|\||<->) '{_WORD}')*")


def tsquery_text_ok(value):
    """True when builder output holds only quoted words, the fixed constants and the
    three operators, so nothing typed can become tsquery syntax. The constants are
    read here, not at import, so --snapshot still imports where search has none of
    them yet; test_search_query.py pins their own shape."""
    constants = (search.APPEARANCE, search.OUTFIT, search.EVE_OUTFIT, search.NG, search.NG_PHRASE)
    for constant in sorted(constants, key=len, reverse=True):
        value = value.replace(constant, "'c'")
    return value == "" or bool(_TSQUERY_TEXT.fullmatch(value))


# The hand-picked part of the hostile corpus; hostile_queries() adds generated ones.
HOSTILE = [
    "", " ", "!!!", "((:*", "' | '", "a:*", "a & b", "a | b", "!a", "a <-> b", "a <2> b", "'", "''", chr(92),
    chr(92) + "'", "'s", "s'", "eve's", "eve" + chr(0x2019) + "s outfit", "new game plus", "new game +", "ng++",
    "ng+ +", "newgame+", "new game p", "drone skin", "eve suits", "outfit", "appearance", "x ", "x" * 300,
    "nano " * 40, chr(0) + "nano", "nano" + chr(0x200B), chr(0x200B) * 3, chr(0xAD), chr(0x3000) + "nano",
    chr(0xD800), "a" + chr(0x7F), STAR * 3, "burst reovery gear " + STAR * 3, "1 2 3 4 5", "0", "_", "__init__",
    "select * from users", "'; drop table users; --", "%", "_%_", ":*:*", "<->", "&|!", "the the the", "an e",
]


def hostile_queries(n=3000, seed=2030):
    """HOSTILE plus n generated queries: tsquery operators and syntax, quotes, backslashes,
    unicode, control characters, words the aliases react to, and text that normalizes
    to nothing."""
    rnd = random.Random(seed)
    syntax = list("&|!():*<>-'\"+@#$%^{}[];,.?/~=`") + [chr(92), "<->", "<2>", "<0>", ":*", ":A", "!!", "&&", "||",
                                                        "' & '", "'s", "++"]
    words = ["nano", "eve", "outfit", "skins", "drone", "appearance", "suit", "ng", "new", "game", "plus", "newgame",
             "the", "an", "in", "eidos", "7", "supply", "box", "fishin", "legionnaire", "memory", "sticks", "a", "s",
             "obvlisiohn", "challgen", "x" * 40, "_", "0", "99999999999999999999"]
    bits = syntax + words + UNICODE_BITS + [" "] * 6
    rare = [chr(0), chr(1), chr(0x7F), chr(0xD800)]
    out = []
    for _ in range(n):
        q = "".join(rnd.choice(bits) for _ in range(rnd.randint(1, 14)))
        out.append(q + rnd.choice(rare) if rnd.random() < 0.05 else q)
    return HOSTILE + out


async def query_checks(s):
    """The hostile corpus the way the router runs it: normalized, unprintable text
    answered without a search, the rest through the real _execute_search. No query may
    raise, and every tsquery string the builder emits must pass tsquery_text_ok."""
    problems, counts = [], Counter()
    queries = hostile_queries()
    for q in queries:
        nq = search.normalize_search_query(q)
        if not nq or not nq.isprintable():
            counts["router"] += 1
            continue
        parsed = search.build_query(nq)
        unsafe = [k for k in ("all_q", "any_q", "lit_q", "phrase_q", "all_j") if not tsquery_text_ok(parsed[k])]
        unsafe += [k for k in ("last", "joined") if not re.fullmatch(r"[^\W_]*", parsed[k])]
        unsafe += ["plain"] if not all(re.fullmatch(_WORD, w) for w in parsed["plain"]) else []
        if unsafe:
            problems.append(f"query {q!r}: unsafe tsquery text in {', '.join(unsafe)}")
        counts["nothing" if parsed["empty"] else "statement"] += 1
        try:
            async with s.begin_nested():
                await search._execute_search(s, nq, 20)
        except Exception as exc:
            problems.append(f"query {q!r}: {type(exc).__name__}: {_first_line(exc)}")
    print(f"{CYAN}Queries{RESET}: {len(queries)} hostile queries, {counts['statement']} through the statement, "
          f"{counts['nothing']} with no words left, {counts['router']} answered by the router: "
          f"{GREEN + 'no errors, tsquery text safe' + RESET if not problems else RED + str(len(problems)) + ' problem(s)' + RESET}")
    return problems


# Every item in the order its type page lists it: level, location, then item.
PAGE_ORDER_SQL = text("""
    SELECT coalesce(ct.category_group, 'collectibles'), ct.slug, c.id, c.title
    FROM collectibles c
    JOIN collectible_type_mappings ctm ON ctm.collectible_id = c.id
    JOIN collectible_types ct ON ct.id = ctm.type_id
    JOIN locations loc ON c.location_id = loc.id
    JOIN levels lv ON loc.level_id = lv.id
    ORDER BY ct.id, lv.display_order, loc.display_order, c.display_order, c.id
""")


async def anchor_checks():
    """A title a type page shows more than once gets numbered anchors (#beta-core-1,
    #beta-core-2), so a link to one of them must carry the number of its own card.
    Searched by title at the API's 50-row maximum, every such item that comes up is
    checked against the page's order. The order lives in the statement's SQL, out of
    reach of the unit tests."""
    async with AsyncSessionLocal() as s:
        await s.execute(text("SET TRANSACTION READ ONLY"))
        rows = (await s.execute(PAGE_ORDER_SQL)).all()
    pages = defaultdict(list)
    for group, slug, cid, title in rows:
        pages[f"/{group}/{slug}"].append((cid, title))
    expected, titles = {}, set()
    for page, items in pages.items():
        anchors = search._build_slug_map(items)
        shared = Counter(search._slugify_title(title) for _, title in items)
        for cid, title in items:
            if shared[search._slugify_title(title)] > 1:
                expected[(page, cid)] = anchors[cid]
                titles.add(title)
    problems, checked = [], 0
    for title in sorted(titles):
        found, _ = await ask(title, 50)
        for r in found:
            page, _, anchor = r["url"].partition("#")
            want = expected.get((page, r["id"])) if fam(r["kind"]) == "item" else None
            if want is None:
                continue
            checked += 1
            if anchor != want:
                problems.append(f"{title!r}: item {r['id']} links #{anchor}, its card on {page} is #{want}")
    print(f"{CYAN}Anchors{RESET}: {checked} links to the {len(expected)} items whose title their type page shows "
          f"more than once: "
          f"{GREEN + 'all match their card' + RESET if not problems else RED + str(len(problems)) + ' wrong' + RESET}")
    return problems


async def section_checks():
    """Every titled walkthrough section is found by its own title, as a result linking
    it, or through its page's row when the page's own words already hold the title. Its
    anchor must be one the page renders: never empty, never shared by two sections of a
    page. Searched at the API's 50-row maximum, so a title on 33 pages fits."""
    async with AsyncSessionLocal() as s:
        await s.execute(text("SET TRANSACTION READ ONLY"))
        rows = (await s.execute(text("SELECT title, mission_type, slug, content FROM walkthroughs ORDER BY id"))).all()
    problems, places, count = [], defaultdict(list), 0
    for title, mission_type, slug, content in rows:
        page, anchors = f"/walkthroughs/{url_type(mission_type)}/{slug}", Counter()
        for block in content if isinstance(content, list) else []:
            heading = block.get("section_title") if isinstance(block, dict) else None
            if not isinstance(heading, str) or not heading.strip():
                continue
            count += 1
            anchor = search._section_anchor(block)
            if anchor is None:
                problems.append(f"{title!r}: section {heading!r} has no anchor")
                continue
            anchors[anchor] += 1
            places[normalize(heading)].append((page, anchor))
        problems += [f"{title!r}: {n} sections share #{anchor}" for anchor, n in anchors.items() if n > 1]
    for q, where in sorted(places.items()):
        found = (await ask(q, 50))[0]
        urls, keys = {r["url"] for r in found}, [(r["kind"], r["id"]) for r in found]
        if len(set(keys)) != len(keys):
            problems.append(f"{q!r}: two results share a kind and id")
        problems += [f"{q!r}: neither {page}#{anchor} nor its page comes up"
                     for page, anchor in where if f"{page}#{anchor}" not in urls and page not in urls]
    print(f"{CYAN}Sections{RESET}: {count} titled sections on {len(rows)} pages, each searched by its title "
          f"({len(places)} titles): {GREEN + 'all found' + RESET if not problems else RED + str(len(problems)) + ' problem(s)' + RESET}")
    return problems


# The statement's section reading over contents passed as text, with the block fetched
# back by position as the results do, and each title's vector.
SECTION_SHAPES_SQL = text(
    "SELECT w.ord, e.pos, e.blk, (w.content -> (e.pos::int - 1)) = e.blk AS same, "
    f"({search._SECTION_TITLE}) IS NULL AS null_vector "
    "FROM (SELECT ord, CAST(content AS jsonb) AS content FROM unnest(CAST(:content AS text[])) "
    "WITH ORDINALITY AS u(content, ord)) w "
    f"CROSS JOIN LATERAL {search._SECTIONS_OF} WHERE {search._TITLED} ORDER BY w.ord, e.pos")


async def section_shape_checks(s):
    """Malformed contents through the statement's section reading: no errors, the block
    fetched back by position is the one read, every title has a vector, and the Python
    side builds each one's snippet and anchor."""
    walkthroughs, _ = malformed_rows()
    contents = _rows_params("walkthroughs", walkthroughs)["content"]
    problems, read = [], 0
    for start in range(0, len(contents), 250):
        try:
            async with s.begin_nested():
                got = (await s.execute(SECTION_SHAPES_SQL, {"content": contents[start:start + 250]})).all()
        except Exception as exc:
            problems.append(f"reading the sections of contents {start}-{start + 249} failed: {_first_line(exc)}")
            continue
        for ordinal, pos, block, same, null_vector in got:
            read += 1
            if not same or null_vector:
                problems.append(f"content {start + ordinal - 1}, section {pos}: fetched back {same}, "
                                f"null vector {null_vector}")
            try:
                search._section_snippet("Page", block)
                search._section_anchor(block)
            except Exception as exc:
                problems.append(f"section {repr(block)[:120]}: {type(exc).__name__}: {_first_line(exc)}")
    print(f"{CYAN}Section reading{RESET}: {read} titled sections in {len(contents)} malformed contents: "
          f"{GREEN + 'all hold' + RESET if not problems else RED + str(len(problems)) + ' problem(s)' + RESET}")
    return problems


async def robustness_checks():
    """Inputs no real row or log holds yet, checked on every run: malformed and very
    large rows, malformed contents where the statement reads sections, adversarial
    links, and hostile queries."""
    async with AsyncSessionLocal() as s:
        await s.execute(text("SET TRANSACTION READ ONLY"))
        problems = (await shape_checks(s) + await section_shape_checks(s) + await link_checks(s)
                    + await query_checks(s))
        await s.rollback()
    return problems


async def check():
    if not BASELINE.exists():
        print(f"{RED}[ERROR]{RESET} no snapshot: run --snapshot before search changes")
        return 1
    base = json.loads(BASELINE.read_text(encoding="utf-8"))
    queries = base["queries"]
    print(f"{CYAN}Snapshot{RESET}: {len(queries)} queries, taken {base['created']} at git {base['git_head']}")
    violations = defaultdict(list)
    after = {}
    started = time.perf_counter()
    for q in queries:
        after[q] = await ask(q)
    print(f"  asked them all again in {time.perf_counter() - started:.0f} s")

    async with AsyncSessionLocal() as s:
        await s.execute(text("SET TRANSACTION READ ONLY"))
        singular_by_url = {f"/{group}/{slug}": name for name, slug, group in (await s.execute(text(
            "SELECT name, slug, coalesce(category_group, 'collectibles') FROM collectible_types"))).all()}
        await load_pages(s)

    stats = defaultdict(Counter)
    for q, entry in queries.items():
        before, (now, corrected) = entry["before"], after[q]
        groups = entry["groups"]
        for tgt in entry["targets"]:
            rb, ra = rank(before, tgt), rank(now, tgt)
            tgroups = target_groups(q, tgt, groups)
            for g in tgroups:
                c = stats[g]
                c["n"] += 1
                c["before1"] += rb == 0
                c["after1"] += ra == 0
                c["before5"] += rb is not None and rb < 5
                c["after5"] += ra is not None and ra < 5
                c["before20"] += rb is not None
                c["after20"] += ra is not None
            if "title" in tgroups and rb == 0 and ra != 0:
                lead = now[0] if now else None
                own_type = (lead and lead["kind"] == "type" and tgt.get("family") == "item"
                            and lead["url"] == before[rb][3].split("#")[0])
                # A page named exactly the query, by title or by a type's singular name ("can" is
                # the Cans page's singular, and also a document's title): the plan ranks it first.
                same_name_page = lead and lead["kind"] in PAGE_KINDS and q in (
                    lead["title"].lower(), singular_by_url.get(lead["url"], "").lower())
                # A section of the same title leads only when its page also names a query word
                # ("fantastic bait": Bait and Fishing Data).
                same_title_section = (lead and lead["id"] < 0 and lead["title"].lower() == q
                                      and names_a_word(PAGES["title_of"].get(page_url(lead["url"]), ""), q))
                if not (own_type or same_name_page or same_title_section):
                    violations["exact title no longer first"].append(f"{q!r}: now #{'-' if ra is None else ra + 1}, "
                                                                     f"led by {fmt(now, 1)}")
            if "grid" in tgroups and rb is not None and rb < 5 and (ra is None or ra >= 5):
                violations["level page left the top 5 (level x type)"].append(
                    f"{q!r}: #{rb + 1} -> {'-' if ra is None else '#' + str(ra + 1)}")
            if "typing" in tgroups and rb is not None and rb < 5 and (ra is None or ra >= 5) \
                    and q not in ALLOWED_TYPING_DROPS:
                violations["typing target left the top 5"].append(
                    f"{q!r} -> {tgt['title']!r}: #{rb + 1} -> {'-' if ra is None else '#' + str(ra + 1)}")
            if "name" in tgroups and (not now or now[0]["url"] != tgt["url"]):
                violations["name query not led by its page"].append(f"{q!r}: led by {fmt(now, 1)}, want {tgt['url']}")
        if groups != ["typing"] and q not in ALLOWED_TEXT_DROPS:
            present = {ident(r) for r in now}
            for b in before[:5]:
                if b[4] and ident(b) not in present:
                    violations["full-text match left the top 20"].append(f"{q!r}: {b[2]!r} (was in today's top 5)")
        if q in EXPECT_FIRST:
            want = EXPECT_FIRST[q]
            if (want is None) != (not now) or (want is not None and not lead_is(now[0], want)):
                violations["expected lead lost"].append(f"{q!r}: led by {fmt(now, 1)}, want {want!r}")
        if q in EXPECT_SECTION_FIRST and not (now and now[0]["id"] < 0 and now[0]["url"] == EXPECT_SECTION_FIRST[q]):
            violations["expected section lead lost"].append(
                f"{q!r}: led by {fmt(now, 1)} ({now[0]['url'] if now else '-'}), want {EXPECT_SECTION_FIRST[q]}")
        keys = [(r["kind"], r["id"]) for r in now]
        if len(set(keys)) != len(keys):
            violations["two results share a kind and id"].append(f"{q!r}: {sorted({k for k in keys if keys.count(k) > 1})}")
        if q in EXPECT_UNCORRECTED and corrected:
            violations["typo-corrected though right as typed"].append(f"{q!r} -> {corrected!r}")
        if before and before[0][0] in ("type", "level"):
            # Sections whose title isn't the query rank after the collectibles a type or level holds.
            kept = {(fam(b[0]), b[2].lower()) for b in before[:5] if fam(b[0]) == "item"}
            for i, r in enumerate(now):
                if r["id"] < 0 and r["title"].lower() != q and any(
                        (fam(x["kind"]), x["title"].lower()) in kept for x in now[i + 1:]):
                    violations["section above a type's or level's own collectible"].append(f"{q!r}: {fmt([r])} at #{i + 1}")
                    break
        if ("brief" in groups or "extra" in groups):
            for r in now[:5]:
                # A section result's match is its title, not its snippet.
                if 2 <= r["score"] < 3 and r["id"] >= 0 and not visible_word(r["snippet"], q, corrected):
                    violations["body hit without a visible query word"].append(
                        f"{q!r}: {r['title']!r}, snippet {(r['snippet'] or '')[:VISIBLE]!r}")

    print(f"\n{CYAN}Brief queries{RESET} (count: top 5, before -> after)")
    for q in BRIEF:
        b, (a, corrected) = queries[q]["before"], after[q]
        fix = f" (typo fallback: {corrected!r})" if corrected else ""
        print(f"  {q:<22} {len(b):>2}: {fmt(b)}\n  {'':<22} {len(a):>2}{fix}: {fmt(a)}")
    print(f"\n{CYAN}Other queries{RESET} (count: top 3, before -> after)")
    for q in EXTRA:
        b, (a, corrected) = queries[q]["before"], after[q]
        print(f"  {q:<28} {len(b):>2}: {fmt(b, 3)}  ->  {len(a):>2}: {fmt(a, 3)}")

    print(f"\n{CYAN}Targets by group{RESET} (#1 / top 5 / top 20, before -> after)")
    for g in sorted(stats):
        c = stats[g]
        print(f"  {g:<14} {c['n']:>5}  #1 {c['before1']:>4} -> {c['after1']:<4}  top5 {c['before5']:>4} -> "
              f"{c['after5']:<4}  top20 {c['before20']:>4} -> {c['after20']}")

    problems = await stored_column_checks()
    for p in problems:
        violations["stored column"].append(p)
    for p in await anchor_checks():
        violations["anchor differs from its card"].append(p)
    for p in await section_checks():
        violations["section not found by its title"].append(p)
    for p in await robustness_checks():
        violations["robustness"].append(p)
    timing_ok, _ = await timing(report_budget=True)
    if not timing_ok:
        violations["timing"].append(f"p90 over {TIMING_BUDGET_MS} ms")

    print()
    if not violations:
        print(f"{GREEN}No regressions.{RESET}")
        return 0
    for kind, items in violations.items():
        print(f"{RED}{kind}: {len(items)}{RESET}")
        for item in items[:40]:
            print(f"  {item}")
        if len(items) > 40:
            print(f"  {GRAY}... {len(items) - 40} more{RESET}")
    return 1


# ---------------------------------------------------------------------------
# Timing
# ---------------------------------------------------------------------------

# The statements search ran before the rework, verbatim, for the prod gate's baseline.
OLD_THRESHOLD = 0.15
OLD_COLLECTIBLES_SQL = text("""
    WITH primary_type AS (
        SELECT DISTINCT ON (ctm.collectible_id)
            ctm.collectible_id,
            ctm.type_id,
            ct.slug,
            ct.category_group
        FROM collectible_type_mappings ctm
        JOIN collectible_types ct ON ctm.type_id = ct.id
        ORDER BY ctm.collectible_id, ctm.type_id
    )
    SELECT
        c.id,
        c.title,
        c.description,
        pt.type_id      AS type_id,
        pt.slug         AS type_slug,
        pt.category_group,
        GREATEST(
            ts_rank(to_tsvector('english', c.title), plainto_tsquery('english', :q)),
            similarity(c.title, :q)::float
        ) AS score
    FROM collectibles c
    JOIN primary_type pt ON c.id = pt.collectible_id
    WHERE
        to_tsvector('english', c.title) @@ plainto_tsquery('english', :q)
        OR similarity(c.title, :q) > :threshold
    ORDER BY score DESC
    LIMIT :limit
""")
OLD_TYPE_COLLECTIBLES_SQL = text("""
    SELECT ctm.type_id AS type_id, c.id AS id, c.title AS title
    FROM collectibles c
    JOIN collectible_type_mappings ctm ON ctm.collectible_id = c.id
    JOIN locations loc ON c.location_id = loc.id
    JOIN levels    lv  ON loc.level_id = lv.id
    WHERE ctm.type_id = ANY(:type_ids)
    ORDER BY ctm.type_id, lv.display_order, loc.display_order, c.display_order
""")
OLD_WALKTHROUGHS_SQL = text("""
    SELECT
        w.id,
        w.title,
        w.subtitle,
        w.slug,
        w.mission_type,
        GREATEST(
            ts_rank(
                to_tsvector('english', w.title || ' ' || COALESCE(w.subtitle, '')),
                plainto_tsquery('english', :q)
            ),
            similarity(w.title, :q)::float
        ) AS score
    FROM walkthroughs w
    WHERE
        to_tsvector('english', w.title || ' ' || COALESCE(w.subtitle, '')) @@ plainto_tsquery('english', :q)
        OR similarity(w.title, :q) > :threshold
    ORDER BY score DESC
    LIMIT :limit
""")
OLD_LEVELS_SQL = text("""
    SELECT
        lv.id,
        lv.name,
        (
            -- Quantity-weighted: the site counts in-game items (a x2 entry
            -- counts 2), matching detail-page headers and the progress page.
            SELECT COALESCE(SUM(COALESCE(c.quantity, 1)), 0)
            FROM locations loc
            JOIN collectibles c ON c.location_id = loc.id
            WHERE loc.level_id = lv.id
        ) AS collectible_count,
        GREATEST(
            ts_rank(to_tsvector('english', lv.name), plainto_tsquery('english', :q)),
            similarity(lv.name, :q)::float
        ) AS score
    FROM levels lv
    WHERE
        to_tsvector('english', lv.name) @@ plainto_tsquery('english', :q)
        OR similarity(lv.name, :q) > :threshold
    ORDER BY score DESC
    LIMIT :limit
""")
OBSERVED_MISS_MEDIAN_MS = 65.0   # prod DB time of a search cache miss before the rework (the brief)
OLD_ROUND_TRIPS = 7.5            # pool_pre_ping (3), BEGIN, three statements, usually the slug map
NEW_ROUND_TRIPS = 5              # pool_pre_ping (3), BEGIN, one statement
TYPO_EXTRA_ROUND_TRIPS = 2       # the vocabulary query and the re-run
GATE_P90_MS = 100.0


async def explain_ms(s, statement, params):
    plan = (await s.execute(text("EXPLAIN (ANALYZE, FORMAT JSON) " + statement.text), params)).scalar()
    return plan[0]["Execution Time"]


async def timing(report_budget=False):
    """Server time per query: the search statement (with the typo path's extra work
    where it runs) and, with --prod, the pre-rework statements for the gate."""
    new_ms, old_ms, typo = [], [], []
    async with AsyncSessionLocal() as s:
        await s.execute(text("SET TRANSACTION READ ONLY"))
        for q in TIMING_QUERIES:
            nq = normalize(q)
            parsed = search.build_query(nq)
            if parsed["empty"]:
                continue
            runs = [await explain_ms(s, search._SEARCH_SQL, search._search_params(nq, parsed, 20)) for _ in range(3)]
            ms = statistics.median(runs)
            _, corrected = await search._execute_search(s, nq, 20)
            if corrected:
                ms += await explain_ms(s, search._VOCAB_SQL, search._vocab_params())
                ms += await explain_ms(s, search._SEARCH_SQL,
                                       search._search_params(corrected, search.build_query(corrected), 20))
                typo.append(q)
            new_ms.append((q, ms))
            if ARGS.prod:
                params = {"q": nq, "limit": 20, "threshold": OLD_THRESHOLD}
                total = 0.0
                for statement in (OLD_COLLECTIBLES_SQL, OLD_WALKTHROUGHS_SQL, OLD_LEVELS_SQL):
                    total += statistics.median([await explain_ms(s, statement, params) for _ in range(3)])
                type_ids = list({r.type_id for r in (await s.execute(OLD_COLLECTIBLES_SQL, params)).all()})
                if type_ids:
                    total += await explain_ms(s, OLD_TYPE_COLLECTIBLES_SQL, {"type_ids": type_ids})
                old_ms.append(total)
        await s.rollback()

    times = sorted(ms for _, ms in new_ms)
    p50, p90 = statistics.median(times), times[int(len(times) * 0.9)]
    label = "prod" if ARGS.prod else "dev"
    print(f"\n{CYAN}Server time on {label}{RESET} ({len(times)} queries, typo path on {len(typo)}): "
          f"median {p50:.1f} ms, p90 {p90:.1f} ms, max {times[-1]:.1f} ms")
    ok = True
    if report_budget:
        ok = p90 <= TIMING_BUDGET_MS
        print(f"  budget p90 <= {TIMING_BUDGET_MS} ms: {GREEN + 'met' + RESET if ok else RED + 'MISSED' + RESET}")
    if ARGS.prod:
        old_p50 = statistics.median(old_ms)
        rtt = (OBSERVED_MISS_MEDIAN_MS - old_p50) / OLD_ROUND_TRIPS
        predicted = sorted(NEW_ROUND_TRIPS * rtt + ms + (TYPO_EXTRA_ROUND_TRIPS * rtt if q in typo else 0)
                           for q, ms in new_ms)
        pp50, pp90 = statistics.median(predicted), predicted[int(len(predicted) * 0.9)]
        ok = pp90 <= GATE_P90_MS
        print(f"  pre-rework statements: median {old_p50:.1f} ms; implied round trip {rtt:.1f} ms")
        print(f"  predicted cache miss: median {pp50:.0f} ms, p90 {pp90:.0f} ms (gate: p90 <= {GATE_P90_MS:.0f} ms) "
              f"-> {GREEN + 'deploy' + RESET if ok else RED + 'DO NOT DEPLOY' + RESET}")
    return ok, times


async def main():
    print(f"{CYAN}--- search_eval: {'snapshot' if ARGS.snapshot else 'timing' if ARGS.timing else 'check'} / "
          f"{'prod' if ARGS.prod else 'dev'} ---{RESET}")
    print(f"  Database: {cc.mask('Postgres', settings.DATABASE_URL)}")
    if WATCHDOG is not None:
        WATCHDOG.start()
    try:
        if ARGS.snapshot:
            return await snapshot()
        if ARGS.timing:
            ok, _ = await timing(report_budget=not ARGS.prod)
            return 0 if ok else 1
        return await check()
    finally:
        await engine.dispose()
        if WATCHDOG is not None:
            WATCHDOG.stop()


if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(main()))
    except Exception as e:
        # Only a connection to prod lost partway through gets the plain message. Anything
        # else is a bug, and keeps its traceback.
        if not (ARGS.prod and cc.lost(e)):
            raise
        cc.report_lost(["Postgres"], e)
        sys.exit(cc.EXIT_UNREACHABLE)
