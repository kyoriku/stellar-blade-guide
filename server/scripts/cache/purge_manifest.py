"""Changed-entity manifest shared by the seeders and the scoped purge.

The seeders record what a run actually changed so the purge can cover those
entities instead of the whole surface. Everything here is built around one
asymmetry: under-purging serves wrong content for up to 30 days (API responses
carry s-maxage=30d), while over-purging costs a cold edge for a few hours. So
every ambiguity widens to the full surface and none of them ever narrows to
nothing.

Concretely, the purge falls back to a full enumeration when the manifest is
missing, unreadable, stamped with a different run, or has a section that began
but never completed. Only an explicitly completed section with an explicitly
empty change list means "nothing to purge here" — absence never does.

Sections are written by separate processes (prod_seed.py runs the two seeders
in sequence), so writes are read-modify-write plus an atomic os.replace. That
is safe because the seeders never run concurrently; it is not safe if they ever
do, and this file would need locking at that point.

The manifest carries DB-native facts — level names, type names with their
category group, walkthrough (mission_type, slug) pairs — not URLs. Translating
those into request-space slugs needs navigation.ts and the route table, which
live in purge_api_cache.py; keeping the mapping there means there is exactly
one place that knows what a URL looks like.
"""

import json
import os
import tempfile
from pathlib import Path

MANIFEST_PATH = Path(__file__).parent / 'purge-manifest.json'

SECTION_COLLECTIBLES = 'collectibles'
SECTION_WALKTHROUGHS = 'walkthroughs'
SECTIONS = (SECTION_COLLECTIBLES, SECTION_WALKTHROUGHS)

STATUS_RUNNING = 'running'
STATUS_COMPLETE = 'complete'

RUN_ID_ENV = 'SEED_RUN_ID'


class ManifestUnusable(Exception):
    """The manifest cannot be trusted for a narrowed purge. Always widen."""


def current_run_id():
    """The run this process belongs to, or None when it is not part of an
    orchestrated run. prod_seed.py exports SEED_RUN_ID to both seeders and
    passes the same value to the purge, which is what ties the three together;
    a seeder run by hand has no run id and therefore cannot authorize a
    narrowed purge."""
    return os.getenv(RUN_ID_ENV) or None


def _read_raw():
    try:
        return json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
    except FileNotFoundError:
        return None
    except (json.JSONDecodeError, OSError):
        # Corrupt or unreadable is indistinguishable from hostile here, and
        # both mean the same thing: do not trust it.
        return None


def _write_atomic(payload):
    """Temp file in the same directory + os.replace, so a crash mid-write
    leaves either the old manifest or the new one, never a truncated file a
    later run would half-believe."""
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(MANIFEST_PATH.parent), suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as fh:
            json.dump(payload, fh, indent=2, sort_keys=True)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, MANIFEST_PATH)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def begin(section, run_id):
    """Mark a section in flight.

    A manifest from any other run is discarded rather than merged — that is
    what stops a previous run's changed set from being purged in place of this
    one's. If the process dies after this point the section stays 'running',
    which the purge treats as unusable.
    """
    if section not in SECTIONS:
        raise ValueError(f'unknown manifest section: {section}')
    if not run_id:
        # Not an orchestrated run: leave no manifest at all rather than one
        # that a later purge might key off.
        clear()
        return
    data = _read_raw() or {}
    if data.get('run_id') != run_id:
        data = {'run_id': run_id, 'sections': {}}
    data.setdefault('sections', {})[section] = {'status': STATUS_RUNNING}
    _write_atomic(data)


def complete(section, run_id, *, level_names=(), type_slugs=(), pairs=()):
    """Record what this section changed. Called only on a successful seed.

    All three are taken straight off the DB rows: `Level.name`,
    `(CollectibleType.slug, CollectibleType.category_group)` tuples, and
    `(Walkthrough.mission_type, Walkthrough.slug)` pairs.

    Types are carried as their stored `slug`, not their name. The name would
    have to be mapped back to request space through `_normalize_slug`, and that
    inversion is lossy — it turns 'glasses' into 'Glass' and 'earrings' into
    'Earring', neither of which is the stored name, so two of the twenty-one
    types would silently fail to map. The slug column is already exactly what
    the URL uses.
    """
    if section not in SECTIONS:
        raise ValueError(f'unknown manifest section: {section}')
    if not run_id:
        return
    data = _read_raw() or {}
    if data.get('run_id') != run_id:
        data = {'run_id': run_id, 'sections': {}}
    data.setdefault('sections', {})[section] = {
        'status': STATUS_COMPLETE,
        'level_names': sorted({str(n) for n in level_names}),
        'type_slugs': sorted({(str(s), g if g is None else str(g)) for s, g in type_slugs}),
        'pairs': sorted({(str(t), str(s)) for t, s in pairs}),
    }
    _write_atomic(data)


def load(expected_run_id):
    """Return the union of completed sections' changed facts.

    Raises ManifestUnusable for every condition that is not an unambiguous,
    complete record of `expected_run_id`. The caller's only correct response to
    that exception is to purge the full surface.
    """
    if not expected_run_id:
        raise ManifestUnusable('no run id to match against')

    data = _read_raw()
    if data is None:
        raise ManifestUnusable('manifest missing or unreadable')
    if not isinstance(data, dict):
        raise ManifestUnusable('manifest is not an object')
    if data.get('run_id') != expected_run_id:
        raise ManifestUnusable(
            f'manifest belongs to run {data.get("run_id")!r}, expected {expected_run_id!r}')

    sections = data.get('sections')
    if not isinstance(sections, dict) or not sections:
        raise ManifestUnusable('manifest records no sections')

    level_names, type_slugs, pairs = set(), set(), set()
    for name, section in sections.items():
        if name not in SECTIONS:
            raise ManifestUnusable(f'unknown section {name!r}')
        if not isinstance(section, dict):
            raise ManifestUnusable(f'section {name!r} is not an object')
        status = section.get('status')
        if status == STATUS_RUNNING:
            raise ManifestUnusable(f'section {name!r} began but never completed')
        if status != STATUS_COMPLETE:
            raise ManifestUnusable(f'section {name!r} has unknown status {status!r}')
        try:
            level_names.update(section.get('level_names') or [])
            type_slugs.update(tuple(t) for t in (section.get('type_slugs') or []))
            pairs.update(tuple(p) for p in (section.get('pairs') or []))
        except TypeError as e:
            raise ManifestUnusable(f'section {name!r} has malformed entries: {e}') from e

    return {
        'level_names': sorted(level_names),
        'type_slugs': sorted(type_slugs),
        'pairs': sorted(pairs),
    }


def clear():
    """Remove the manifest. Called after a successful purge so a later run can
    never re-purge a stale changed set, and at the start of an unorchestrated
    seed so no manifest outlives the run that wrote it."""
    try:
        MANIFEST_PATH.unlink()
    except FileNotFoundError:
        pass
