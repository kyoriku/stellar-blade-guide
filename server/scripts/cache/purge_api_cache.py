"""
Scoped Cloudflare purge for the seeded API surface.

Usage:
  uv run python scripts/cache/purge_api_cache.py            # derive + purge
  uv run python scripts/cache/purge_api_cache.py --dry-run  # derive + list only
  uv run python scripts/cache/purge_api_cache.py --all      # ignore the narrowing,
                                                            # purge the full surface
  uv run python scripts/cache/purge_api_cache.py --run-id X # require run X's records
  uv run python scripts/cache/purge_api_cache.py --clear-ledger
                                    # clear the ledger once the purge succeeds;
                                    # prod_seed.py passes it, a run by hand doesn't
  uv run python scripts/cache/purge_api_cache.py --singular-walkthroughs
                                    # one-time: the walkthrough URLs under the DB
                                    # spelling of a type (side-quest), read from the
                                    # PROD database; leaves the ledger alone

Any other argument stops it with exit 2 before anything is derived or purged.

The purge covers every change the ledger (scripts/cache/purge_manifest.py) still owes,
from this run and any earlier run that stopped before its purge succeeded. --run-id
defaults to $SEED_RUN_ID, which prod_seed.py exports when it seeds; with it, the purge
also requires that run's two records. Anything the ledger can't vouch for widens to the
full surface, which then also carries every walkthrough URL the ledger recorded: the
surface is derived from the current DB and can't name a renamed or deleted page's old URL.

Only a purge prod_seed.py started clears the ledger (--clear-ledger). A run by hand, which
also reads whatever database DATABASE_URL names, leaves it for prod_seed.py.

Derives the full cached API URL space live (FastAPI route table x DB slugs x
client navigation constants), batches purge calls at 30 URLs (Pro plan limit),
and verifies every API response. There is no fallback: a failure stops with a last line
that names the cause, and nothing else is purged. A partial purge is harmless, since the
ledger keeps every record until a purge succeeds and the next one repeats them.

The surface is derived live and grows with the content: 136 URLs as of
2026-10-25 (12 levels, the two pseudo-levels included, and 95 walkthroughs),
up from 81 at the 2026-07-16 re-baseline. Nothing here hardcodes that number
(`--dry-run` prints the current set), but SANITY_FLOOR below was set against
the 81, so check the two together.

Exit codes tell prod_seed.py whether retrying is worth anything:
  0  purged (or listed, under --dry-run)
  1  TRANSIENT  — Cloudflare timed out, refused with 429, or 5xx'd. Retry.
  2  PERMANENT  — the URL list couldn't be built (no answer from the database, an
                  unknown route shape, the sanity floor, a record that maps to no URL)
                  or Cloudflare refused the purge (a missing or rejected token). The
                  same call fails identically, so retrying is pointless.

Invoked by prod_seed.py with the PROD DATABASE_URL in the environment, so
slugs are derived from exactly what the content deploy just wrote. A run of
this script never purges an image: images are cached as immutable, and a
content change gets a new key. The only image purge is upload_r2.py --overwrite,
for quality-only refreshes, which hands exactly the URLs it replaced to purge()
below (see scripts/images/PIPELINE.md).
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import json
import re
from pathlib import Path

import requests
from dotenv import load_dotenv

from scripts.cache import purge_manifest
from scripts.db import check_connections as cc

load_dotenv()

# The apex is canonical (www 301s to it), so one host covers the cached space.
PUBLIC_BASE = 'https://stellarbladeguide.com'
CACHED_PREFIXES = ('/api/walkthroughs', '/api/levels', '/api/collectibles',
                   '/api/upgrades', '/api/cosmetics')
BATCH_SIZE = 30      # Pro plan: purge-by-URL takes at most 30 per call
SANITY_FLOOR = 50    # a smaller full surface means the derivation broke somewhere,
                     # so the run stops with exit 2 and purges nothing. It checks
                     # only the full enumeration: check_narrowed() guards the
                     # narrowed set, which can legitimately be three or four URLs.
                     # Note the drift: 50 was set when the surface was 81 URLs
                     # (62% of it), and the surface is 136 as of 2026-10-25, so it
                     # is 37%: a derivation that silently lost half the
                     # walkthroughs would still clear it.
NAVIGATION_TS = Path(__file__).resolve().parents[3] / 'client' / 'src' / 'constants' / 'navigation.ts'

EXIT_TRANSIENT = 1
EXIT_PERMANENT = 2

# Statuses where the identical call can plausibly succeed later. 401/403 (missing
# or unscoped token) and 400 (malformed batch) are deliberately absent: retrying
# those only repeats the same refusal.
RETRYABLE_STATUSES = frozenset({408, 429, 500, 502, 503, 504})


class TransientPurgeError(RuntimeError):
    """A Cloudflare-side failure worth retrying — timeout, connection drop, 429, 5xx."""


class CloudflareRefused(RuntimeError):
    """Cloudflare refused the purge in a way a retry can't change: a 400, 401 or 403, or a
    response saying it failed. Also a missing token or zone ID."""


class UrlListError(RuntimeError):
    """The URL list couldn't be built, so nothing was purged."""


NO_DB_ANSWER = ('\033[31m✗ No answer from the database for {seconds} s while building the URL '
                'list; nothing was purged.\033[0m')


def kebab(name):
    return name.lower().replace(' ', '-')


def parse_navigation():
    """Client slug constants per section from navigation.ts (uncommented
    entries only). These are the request space for type-parameterized routes:
    the DB stores names/singulars, but the edge caches what clients ask for."""
    text = NAVIGATION_TS.read_text(encoding='utf-8')
    sections = {}
    for m in re.finditer(r'export const (\w+) = \[(.*?)\]', text, re.S):
        name, body = m.group(1), m.group(2)
        slugs = [s.group(1)
                 for line in body.splitlines()
                 if not line.strip().startswith('//')
                 if (s := re.search(r"slug:\s*'([^']+)'", line))]
        sections[name] = slugs
    for required in ('WALKTHROUGHS', 'COLLECTIBLES', 'UPGRADES', 'COSMETICS'):
        if not sections.get(required):
            raise RuntimeError(f'navigation.ts parse: section {required} empty or missing')
    return sections


def load_db_sources():
    """Level/walkthrough slugs from the database this process was
    pointed at (prod when invoked by prod_seed.py).

    Read through the scripts' own engine under a watchdog: through a dead tunnel the
    read could otherwise hang for minutes (scripts/db/seed_guard.py)."""
    import asyncio
    from sqlalchemy import select
    from app.models.collectibles import Level
    from app.models.walkthroughs import Walkthrough
    from app.routers.walkthroughs import _normalize_type
    from scripts.db.seed_guard import (
        ANSWER_SECONDS, NO_ANSWER_SECONDS, Watchdog, seed_engine, seed_sessionmaker, watch_engine,
    )

    watchdog = Watchdog(NO_ANSWER_SECONDS, EXIT_PERMANENT,
                        lambda: NO_DB_ANSWER.format(seconds=NO_ANSWER_SECONDS))

    async def q():
        engine = seed_engine('purge_api_cache')
        watch_engine(engine, watchdog)
        watchdog.start()
        async with seed_sessionmaker(engine)() as s:
            levels = (await s.execute(select(Level.name))).scalars().all()
            wts = (await s.execute(select(Walkthrough.mission_type, Walkthrough.slug))).all()
        await engine.dispose()
        return levels, wts

    try:
        levels, wts = asyncio.run(q())
    except TimeoutError as e:   # carries no text of its own
        raise RuntimeError(f'no answer from the database within {ANSWER_SECONDS} s') from e
    finally:
        watchdog.stop()
    if not levels or not wts:
        raise RuntimeError('DB slug query returned an empty set')

    # DB mission_type is singular; clients request the plural nav slug. Build
    # the DB->URL map by inverting the server's own normalizer over the nav
    # slugs, so no plural mapping is ever hand-listed here.
    nav_types = parse_navigation()['WALKTHROUGHS']
    db_to_url = {_normalize_type(s): s for s in nav_types}
    unmapped = sorted({t for t, _ in wts} - set(db_to_url))
    if unmapped:
        raise RuntimeError(f'walkthrough types with no navigation slug: {unmapped}')

    return {
        'levels': sorted({kebab(lv) for lv in levels}),
        'walkthrough_pairs': sorted({(db_to_url[t], slug) for t, slug in wts}),
        'walkthrough_types': nav_types,
        # Exposed so the narrowed path can map the manifest's raw DB
        # mission_types through the same inversion the full path uses.
        'db_type_to_url': db_to_url,
    }


# category_group -> navigation.ts section. NULL resolves as collectibles, the
# same default app/services/collectibles.py applies. 'materials' is retired
# (its two types moved into collectibles, Sept 2026) and kept only as an alias:
# a manifest written by a seed that ran against a not-yet-flipped DB then still
# narrows to the collectibles section instead of widening the whole purge.
SECTION_FOR_GROUP = {
    'collectibles': 'COLLECTIBLES',
    'upgrades': 'UPGRADES',
    'cosmetics': 'COSMETICS',
    'materials': 'COLLECTIBLES',
}


def scope_sources(changed, db, nav):
    """Narrow the derivation inputs to the entities a seed actually changed.

    derive_urls() is reused verbatim rather than reimplemented: handing it a
    restricted `db`/`nav` yields exactly the URLs those entities reach. That
    keeps one expander, so the narrowed path cannot drift from the full one and
    an unrecognized route shape still raises on both.

    The index-page dependency is handled per domain, not globally. A global
    list is only stale when something it contains changed, so
    `/api/collectibles/` is purged for any collectible-domain change and
    `/api/walkthroughs/` for any walkthrough change — never the other one.
    Otherwise every collectible-only seed would evict a warm walkthrough
    index, which during a long editorial pass is every single run.

    Anything unmappable raises, which the caller turns into a full purge.
    """
    levels = sorted({kebab(name) for name in changed['level_names']})

    by_section = {section: set() for section in SECTION_FOR_GROUP.values()}
    for slug, group in changed['type_slugs']:
        section = SECTION_FOR_GROUP.get(group or 'collectibles')
        if section is None:
            raise RuntimeError(f'type {slug!r} has unknown category_group {group!r}')
        if slug not in nav[section]:
            raise RuntimeError(f'type slug {slug!r} is absent from navigation section {section}')
        by_section[section].add(slug)

    # Current and removed walkthroughs are mapped identically and both get
    # purged; they are kept apart only so the caller's subset check knows which
    # URLs are legitimately absent from the surface derived from the current DB.
    pairs, removed, wtypes = set(), set(), set()
    for target, source in ((pairs, changed['pairs']),
                           (removed, changed.get('pairs_removed', ()))):
        for mission_type, slug in source:
            url_type = db['db_type_to_url'].get(mission_type)
            if url_type is None:
                raise RuntimeError(f'walkthrough type {mission_type!r} has no navigation slug')
            target.add((url_type, slug))
            wtypes.add(url_type)   # a deletion stales its type index just as an edit does

    scoped_db = {
        'levels': levels,
        'walkthrough_pairs': sorted(pairs | removed),
        'walkthrough_types': sorted(wtypes),
        'db_type_to_url': db['db_type_to_url'],
    }
    scoped_nav = {section: sorted(slugs) for section, slugs in by_section.items()}
    scoped_nav['WALKTHROUGHS'] = sorted(wtypes)

    # Which global indexes are actually stale. /api/collectibles/ spans every
    # type, so any collectible-domain change (a level or a type page) stales
    # it — deliberately not narrowed per category, since deciding when it is
    # safely skippable would cost more than the one URL it saves. It is simply
    # left out when nothing in its domain moved.
    index_prefixes = set()
    if levels or any(by_section.values()):
        index_prefixes.update(('/api/collectibles', '/api/levels', '/api/upgrades',
                               '/api/cosmetics'))
    if pairs or removed:
        index_prefixes.add('/api/walkthroughs')
    return scoped_db, scoped_nav, index_prefixes, removed


_EMPTY_NAV = {section: [] for section in SECTION_FOR_GROUP.values()} | {'WALKTHROUGHS': []}


def removed_detail_urls(routes, removed_pairs, db):
    """URLs of walkthroughs a seed deleted, or renamed away from.

    These are absent from the current surface by definition — the row is gone —
    yet they are exactly what most needs purging: the origin now 404s them while
    the edge still holds a warm 200. So the subset check must tolerate them, and
    it can do so safely because they are recorded rather than inferred: the
    seeder captured each pair from the row before deleting or renaming it, and
    the type half went through the same mapping table as every other pair, so
    an unmappable type still raises in scope_sources.

    Derived through derive_urls with only these pairs and every index gated
    off, so what a detail URL looks like stays defined in one place.
    """
    if not removed_pairs:
        return []
    only_removed = {
        'levels': [],
        'walkthrough_pairs': sorted(removed_pairs),
        'walkthrough_types': [],
        'db_type_to_url': db['db_type_to_url'],
    }
    return derive_urls(routes, only_removed, _EMPTY_NAV, index_prefixes=set())


def split_gone_pairs(changed, db):
    """`changed` with every recorded walkthrough pair that no longer exists counted as a
    removal. An earlier run's record can name a walkthrough a later run renamed or deleted:
    its URL is gone from the current surface, yet the edge may still hold it, so it is
    purged like any removal instead of failing the subset check."""
    current = set(db['walkthrough_pairs'])
    to_url = db['db_type_to_url']
    still, gone = [], set(changed.get('pairs_removed') or [])
    for mission_type, slug in changed.get('pairs') or []:
        if (to_url.get(mission_type), slug) in current:
            still.append((mission_type, slug))
        else:
            gone.add((mission_type, slug))
    return {**changed, 'pairs': still, 'pairs_removed': sorted(gone)}


def recorded_pair_urls(routes, recorded, db, nav):
    """The detail page and type list of every walkthrough the ledger recorded, changed or
    removed. A full-surface purge derives its list from the current DB, which can't name a
    renamed or deleted walkthrough's old URL; these can. A pair whose type maps to no URL
    raises, so the purge fails and the ledger keeps it."""
    pairs = sorted(set(recorded.get('pairs') or []) | set(recorded.get('pairs_removed') or []))
    if not pairs:
        return []
    only_pairs = {'level_names': [], 'type_slugs': [], 'pairs': [], 'pairs_removed': pairs}
    scoped_db, scoped_nav, index_prefixes, _removed = scope_sources(only_pairs, db, nav)
    return derive_urls(routes, scoped_db, scoped_nav, index_prefixes)


def singular_walkthrough_urls(routes, db):
    """One-time: walkthrough URLs under the DB spelling of a type whose URL spelling
    differs (/api/walkthroughs/side-quest and /api/walkthroughs/side-quest/<slug>).

    Search and reply notifications used to link these, the API served them, and the
    edge cached them where the seed purge never looks. The API now redirects them,
    no-store, so whatever the edge still holds is the last copy and one purge clears
    it. The types come from the rows, so a type with no walkthroughs adds no list
    URL. Derived through derive_urls like removed_detail_urls, so what a URL looks
    like stays defined in one place.
    """
    url_to_db = {url: t for t, url in db['db_type_to_url'].items() if t != url}
    pairs = sorted((url_to_db[url], slug) for url, slug in db['walkthrough_pairs'] if url in url_to_db)
    if not pairs:
        raise RuntimeError('no walkthrough type is spelled differently in the DB and in URLs')
    singular = {
        'levels': [],
        'walkthrough_pairs': pairs,
        'walkthrough_types': sorted({t for t, _ in pairs}),
        'db_type_to_url': db['db_type_to_url'],
    }
    return derive_urls(routes, singular, _EMPTY_NAV, index_prefixes=set())


def derive_urls(routes, db, nav, index_prefixes=None):
    """Expand every cached GET route into concrete URLs. A route under a
    cached prefix whose shape is not recognized raises, and since main()
    derives the full surface first, the purge then stops with nothing purged:
    new routes can appear automatically or fail loudly, never be silently
    skipped.

    index_prefixes gates the parameterless list routes (/api/collectibles/,
    /api/walkthroughs/). None — the full path — emits every one. The narrowed
    path passes the prefixes whose domain actually changed, so a
    collectible-only seed no longer evicts the walkthrough index and vice
    versa: a global list is only stale when something it contains changed.
    """
    type_slugs = {
        '/api/collectibles': nav['COLLECTIBLES'],
        '/api/upgrades': nav['UPGRADES'],
        '/api/cosmetics': nav['COSMETICS'],
    }
    urls = []
    for route in routes:
        methods = getattr(route, 'methods', None)
        path = getattr(route, 'path', '')
        if not methods or 'GET' not in methods or not path.startswith(CACHED_PREFIXES):
            continue
        params = re.findall(r'\{(\w+)\}', path)
        prefix = '/' + '/'.join(path.split('/')[1:3])  # e.g. /api/levels
        if not params:
            if index_prefixes is None or prefix in index_prefixes:
                urls.append(path)
        elif params == ['level_name']:
            urls += [path.format(level_name=lv) for lv in db['levels']]
        elif params == ['walkthrough_type']:
            urls += [path.format(walkthrough_type=t) for t in db['walkthrough_types']]
        elif params == ['walkthrough_type', 'slug']:
            urls += [path.format(walkthrough_type=t, slug=s)
                     for t, s in db['walkthrough_pairs']]
        elif params == ['type_name'] and prefix in type_slugs:
            urls += [path.format(type_name=t) for t in type_slugs[prefix]]
        else:
            raise RuntimeError(f'cached route with unrecognized shape: {path} (params {params})')
    return [f'{PUBLIC_BASE}{u}' for u in urls]


def purge(urls):
    zone = os.getenv('CLOUDFLARE_ZONE_ID')
    token = os.getenv('CLOUDFLARE_API_TOKEN')
    if not zone or not token:
        raise CloudflareRefused('CLOUDFLARE_ZONE_ID / CLOUDFLARE_API_TOKEN not set in server/.env')
    purged = 0
    for i in range(0, len(urls), BATCH_SIZE):
        batch = urls[i:i + BATCH_SIZE]
        batch_no = i // BATCH_SIZE + 1
        try:
            response = requests.post(
                f'https://api.cloudflare.com/client/v4/zones/{zone}/purge_cache',
                headers={'Authorization': f'Bearer {token}'},
                json={'files': batch},
                timeout=10,
            )
        except requests.Timeout as e:
            raise TransientPurgeError(f'batch {batch_no} timed out after 10s ({type(e).__name__})') from e
        except requests.RequestException as e:
            raise TransientPurgeError(f'batch {batch_no} connection failure: {type(e).__name__}') from e

        # Report the status explicitly rather than via raise_for_status(), whose
        # message embeds the request URL and would put the zone ID in the log.
        if response.status_code in RETRYABLE_STATUSES:
            raise TransientPurgeError(f'batch {batch_no} got HTTP {response.status_code} from Cloudflare')
        if not response.ok:
            raise CloudflareRefused(f'batch {batch_no} got HTTP {response.status_code} from Cloudflare')

        result = response.json()
        if not result.get('success'):
            raise CloudflareRefused(f'batch {batch_no} rejected: {result.get("errors")}')
        purged += len(batch)
        print(f"\033[90m  [{purged}/{len(urls)}] purged\033[0m")
    return purged


CHANGE_KEYS = ('level_names', 'type_slugs', 'pairs', 'pairs_removed')


def has_changes(changed):
    """Whether a manifest records anything to purge.

    `pairs_removed` must count. A seed that only deleted walkthroughs has no
    current-entity changes at all, and reading that as "nothing to purge" would
    leave every deleted page serving from the edge for 30 days.
    """
    return any(changed.get(key) for key in CHANGE_KEYS)


def check_narrowed(narrowed, full_urls, removed_urls=()):
    """Guards for the narrowed set.

    There is deliberately no lower bound here, which is the whole reason the
    old single SANITY_FLOOR could not serve both paths: a purge covering one
    edited collectible is legitimately three or four URLs. What must hold
    instead is that every URL narrowing produces is accounted for — either in
    the surface derived from the current DB, or a recorded removal — and that
    a manifest reporting changes never derives nothing.

    Removed URLs are tolerated, not skipped: an unmappable type on a removed
    pair still raised upstream in scope_sources. What this catches is a URL
    the mapping invented — one that neither exists now nor was recorded as
    having existed.
    """
    tolerated = set(full_urls) | set(removed_urls)
    extra = sorted(set(narrowed) - tolerated)
    if extra:
        raise RuntimeError(
            f'narrowed set has {len(extra)} URL(s) that are neither in the current '
            f'surface nor a recorded removal, e.g. {extra[0]} — the changed-entity '
            f'mapping is wrong')
    if not narrowed:
        raise RuntimeError('manifest reports changes but the narrowed set is empty')


# Every flag main() reads. Anything else stops the run before anything happens: a mistyped
# --dry-run used to purge for real.
FLAGS = ('--dry-run', '--all', '--singular-walkthroughs', '--clear-ledger', '--run-id')


def unknown_flags(args):
    """The arguments main() would otherwise ignore. --run-id takes a value, as --run-id X or
    --run-id=X."""
    unknown, i = [], 0
    while i < len(args):
        arg = args[i]
        if arg == '--run-id':
            i += 2
            continue
        if arg not in FLAGS and not arg.startswith('--run-id='):
            unknown.append(arg)
        i += 1
    return unknown


def _flag_value(args, name):
    """Support both --run-id=X and --run-id X."""
    for i, arg in enumerate(args):
        if arg == name:
            return args[i + 1] if i + 1 < len(args) else None
        if arg.startswith(f'{name}='):
            return arg.split('=', 1)[1]
    return None


def main():
    args = sys.argv[1:]
    unknown = unknown_flags(args)
    if unknown:
        print(f'\033[31m✗ Unknown option {unknown[0]!r}: nothing was purged. The options are '
              f'{", ".join(FLAGS)}.\033[0m')
        sys.exit(EXIT_PERMANENT)
    dry_run = '--dry-run' in args
    force_all = '--all' in args
    singular = '--singular-walkthroughs' in args
    may_clear = '--clear-ledger' in args
    run_id = _flag_value(args, '--run-id') or purge_manifest.current_run_id()

    print('\033[36m=== Scoped API cache purge ===\033[0m')
    if singular:
        # The stale URLs were cached from prod, so they are derived from prod, the way
        # prod_seed.py points its child here. Set before the app import, which builds
        # the engine from DATABASE_URL. The check comes before that import too: a closed
        # tunnel stops here with the line to run, and a URL its driver would misread stops
        # before anything parses it, since a parser's error quotes the password.
        prod_db = os.environ.get('PROD_DATABASE_URL')
        if not prod_db:
            raise RuntimeError('--singular-walkthroughs needs PROD_DATABASE_URL (server/.env)')
        print(f'  Database: {cc.mask("Postgres", prod_db)}')
        os.environ['DATABASE_URL'] = prod_db
        cc.require(['Postgres'])

    try:
        from app.main import app  # route table is the source of truth for shapes
        nav = parse_navigation()
        db = load_db_sources()

        # The full surface is derived first regardless of scope: it is the floor
        # check, and it is what the narrowed set is validated against. Deriving it
        # also means an unrecognized route shape raises here, before any narrowing.
        full_urls = derive_urls(app.routes, db, nav)
        if len(full_urls) < SANITY_FLOOR:
            raise RuntimeError(
                f'derived only {len(full_urls)} URLs (< {SANITY_FLOOR}) — refusing partial purge')
    except Exception as e:
        raise UrlListError(_first_line(e)) from e
    print(f'Full surface: {len(full_urls)} cached API URLs '
          f'({len(db["levels"])} levels, {len(db["walkthrough_pairs"])} walkthroughs)')

    urls, scope = full_urls, 'full surface'
    if singular:
        urls, scope = singular_walkthrough_urls(app.routes, db), 'singular walkthrough spellings (one-time)'
    else:
        try:
            changed = purge_manifest.load(run_id)
        except purge_manifest.ManifestUnusable as e:
            changed, unusable = None, e
        if force_all:
            print('  --all: purging the full surface by request')
            urls = _full_with_recorded(app.routes, full_urls, db, nav)
        elif changed is None:
            # Every ambiguity widens. Under-purging serves stale content for up
            # to 30 days; over-purging costs a cold edge for a few hours.
            print(f'\033[33m  widening to the full surface: {unusable}\033[0m')
            urls = _full_with_recorded(app.routes, full_urls, db, nav)
        elif not has_changes(changed):
            # Every run the ledger holds recorded, and none of them changed anything.
            print('  manifest: no entities changed, nothing to purge')
            urls, scope = [], 'no changes'
        else:
            try:
                changed = split_gone_pairs(changed, db)
                scoped_db, scoped_nav, index_prefixes, removed = scope_sources(changed, db, nav)
                narrowed = derive_urls(app.routes, scoped_db, scoped_nav, index_prefixes)
                check_narrowed(narrowed, full_urls, removed_detail_urls(app.routes, removed, db))
                urls, scope = narrowed, 'changed entities'
                print(f'  manifest: {len(changed["level_names"])} level(s), '
                      f'{len(changed["type_slugs"])} type(s), '
                      f'{len(changed["pairs"])} walkthrough(s) changed, '
                      f'{len(changed.get("pairs_removed", ()))} removed '
                      f'→ {len(urls)} URLs')
            except RuntimeError as e:
                print(f'\033[33m  widening to the full surface: {e}\033[0m')
                urls = _full_with_recorded(app.routes, full_urls, db, nav)
        if changed and changed['earlier_runs']:
            print(f'  includes earlier run(s) not yet purged: {", ".join(changed["earlier_runs"])}')

    # Always name the URLs, not just how many. prod_seed.py streams this into
    # the run log, so the list is the record of exactly what was invalidated —
    # without it you have to guess which pages to re-check at the edge.
    print(f'Scope: {scope} — {len(urls)} URL(s)')
    for u in urls:
        print(f'  {u}')

    if dry_run:
        print(f'\033[33mDRY RUN: nothing purged\033[0m')
        return

    purged = purge(urls)
    # The one-time singular purge covers none of the ledger's records, so it leaves them.
    if not singular:
        if may_clear:
            try:
                purge_manifest.clear()
            except OSError as e:
                print(f'\033[33m  Couldn\'t clear the ledger ({type(e).__name__}: {e}); the next '
                      f'purge repeats these URLs\033[0m')
        else:
            owed = purge_manifest.owed()
            if owed:
                print(f'\033[33m  The ledger still lists {len(owed)} run(s) owed a purge; only a purge '
                      f'prod_seed.py starts clears it\033[0m')
    print(f'\033[32m✓ Purged {purged} API URLs ({scope}); image cache left warm\033[0m')


def _full_with_recorded(routes, full_urls, db, nav):
    """The full surface plus every walkthrough URL the ledger recorded (see
    recorded_pair_urls). A ledger that can't be read adds nothing: its records are unknown."""
    try:
        recorded = purge_manifest.load_all()
    except purge_manifest.ManifestUnusable:
        return full_urls
    try:
        extra = recorded_pair_urls(routes, recorded, db, nav)
    except RuntimeError as e:
        raise UrlListError(f'a recorded walkthrough maps to no URL: {e}') from e
    return full_urls + sorted(set(extra) - set(full_urls))


def _first_line(exc):
    text = str(exc).strip()
    return text.splitlines()[0][:300] if text else type(exc).__name__


if __name__ == '__main__':
    try:
        main()
    except TransientPurgeError as e:
        print(f'\033[31m✗ Cloudflare kept failing: {e}. Any batches listed above as purged are '
              f'done; the ledger keeps every record, so the next purge repeats them.\033[0m')
        sys.exit(EXIT_TRANSIENT)
    except UrlListError as e:
        print(f'\033[31m✗ Couldn\'t build the URL list: {e}. Nothing was purged.\033[0m')
        sys.exit(EXIT_PERMANENT)
    except CloudflareRefused as e:
        print(f'\033[31m✗ Cloudflare refused the purge: {e}. Check CLOUDFLARE_API_TOKEN and '
              f'CLOUDFLARE_ZONE_ID in server/.env. The ledger keeps every record.\033[0m')
        sys.exit(EXIT_PERMANENT)
    except Exception as e:
        print(f'\033[31m✗ Purge failed: {_first_line(e)}. The ledger keeps every record.\033[0m')
        sys.exit(EXIT_PERMANENT)
