"""Ledger of the changes prod's edge cache still owes a purge.

Each seeder records what it is about to change before its COMMIT, under the run id
prod_seed.py exports. The purge covers every run recorded here, and the file is cleared
only when a purge prod_seed.py started succeeds. So a run that stops after a COMMIT, in the
Redis clear, the purge or a Ctrl+C, leaves its changes here for the next run to purge. Before
the ledger, the next run threw them away and purged only rows that still differed.

A record is never discarded. A run that rolled back still gets purged next time, which costs
a few extra URLs. Dropping a record whose COMMIT did land would leave stale pages at the edge
for 30 days (API responses carry s-maxage=30d), so the ledger always errs towards purging.
For the same reason anything the ledger can't vouch for widens the purge to the full
surface: an unreadable file (set aside, never deleted) or a section an older version of this
file left "running".

It holds DB-native facts: level names, (type slug, category group) pairs and walkthrough
(mission_type, slug) pairs. purge_api_cache.py turns them into URLs, so exactly one place
knows what a URL looks like.

Only runs started by prod_seed.py write here: a seeder run by hand has no run id and never
touches the file. prod_seed.py holds a run lock and runs the seeders one at a time, so a
read-modify-write with an atomic replace is safe.
"""

import json
import os
import tempfile
import time
from pathlib import Path

MANIFEST_PATH = Path(__file__).parent / 'purge-manifest.json'

SECTION_COLLECTIBLES = 'collectibles'
SECTION_WALKTHROUGHS = 'walkthroughs'
SECTIONS = (SECTION_COLLECTIBLES, SECTION_WALKTHROUGHS)

RUN_ID_ENV = 'SEED_RUN_ID'

FACT_KEYS = ('level_names', 'type_slugs', 'pairs', 'pairs_removed')


class ManifestUnusable(Exception):
    """The ledger can't be trusted for a narrowed purge. Always widen."""


def current_run_id():
    """The run this process belongs to, or None when prod_seed.py didn't start it.
    prod_seed.py exports SEED_RUN_ID to the seeders and the purge."""
    return os.getenv(RUN_ID_ENV) or None


def _empty():
    return {'runs': {}, 'widen': False}


def _from_v1(data):
    """Read the format before the ledger, {run_id, sections}, as one earlier run. Its
    complete sections carry forward; one left "running" means changes nobody recorded."""
    ledger = _empty()
    run = {}
    for name, section in (data.get('sections') or {}).items():
        if not isinstance(section, dict) or section.get('status') != 'complete':
            ledger['widen'] = True
            continue
        run[name] = {key: section.get(key) or [] for key in FACT_KEYS if key in section}
    if run:
        ledger['runs'][str(data.get('run_id'))] = run
    return ledger


def _read():
    """(ledger, None), or (None, why) when the file can't be read as a ledger."""
    try:
        data = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
    except FileNotFoundError:
        return _empty(), None
    except (json.JSONDecodeError, UnicodeDecodeError, OSError) as e:
        return None, f'unreadable ({type(e).__name__})'
    if not isinstance(data, dict):
        return None, 'not a JSON object'
    if 'run_id' in data and 'runs' not in data:
        return _from_v1(data), None
    if not isinstance(data.get('runs'), dict):
        return None, 'no runs object'
    return {'runs': data['runs'], 'widen': bool(data.get('widen'))}, None


def _write_atomic(payload):
    """Temp file in the same directory + os.replace, so a crash mid-write leaves either the
    old ledger or the new one, never a truncated file."""
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


def record(section, run_id, *, level_names=(), type_slugs=(), pairs=(), pairs_removed=()):
    """Record what a seeder is about to change. Call it before COMMIT, so a COMMIT that lands
    and then loses its acknowledgement is still purged.

    Every other run's record stays. A file this can't read is moved aside, not overwritten,
    and the new ledger widens the next purge, since what it held is unknown. Without a run id
    (a seeder run by hand) this does nothing.
    """
    if section not in SECTIONS:
        raise ValueError(f'unknown manifest section: {section}')
    if not run_id:
        return
    ledger, problem = _read()
    if ledger is None:
        aside = MANIFEST_PATH.with_name(f'{MANIFEST_PATH.name}.unreadable-{time.strftime("%Y%m%d-%H%M%S")}')
        os.replace(MANIFEST_PATH, aside)
        print(f'\033[33m  Purge manifest was {problem}: moved to {aside.name}; '
              f'the next purge covers the full surface\033[0m')
        ledger = _empty()
        ledger['widen'] = True
    ledger['runs'].setdefault(run_id, {})[section] = {
        'level_names': sorted({str(n) for n in level_names}),
        'type_slugs': sorted({(str(s), g if g is None else str(g)) for s, g in type_slugs}),
        'pairs': sorted({(str(t), str(s)) for t, s in pairs}),
        'pairs_removed': sorted({(str(t), str(s)) for t, s in pairs_removed}),
    }
    _write_atomic(ledger)


def load(run_id=None):
    """The union of every recorded run's changes, with the runs it covers.

    Raises ManifestUnusable, whose only right answer is a full-surface purge, when the file
    can't be read, when it was marked to widen, or when run_id is given and that run didn't
    record both sections.
    """
    ledger, problem = _read()
    if ledger is None:
        raise ManifestUnusable(f'manifest is {problem}')
    if ledger['widen']:
        raise ManifestUnusable('an earlier record was unreadable or never completed')
    runs = ledger['runs']
    if run_id:
        mine = runs.get(run_id, {})
        missing = [name for name in SECTIONS if name not in mine]
        if missing:
            raise ManifestUnusable(f'this run recorded no {" or ".join(missing)} changes')

    facts = {key: set() for key in FACT_KEYS}
    for name, run in runs.items():
        if not isinstance(run, dict):
            raise ManifestUnusable(f'run {name!r} is not an object')
        for section_name, section in run.items():
            if section_name not in SECTIONS:
                raise ManifestUnusable(f'unknown section {section_name!r}')
            if not isinstance(section, dict):
                raise ManifestUnusable(f'section {section_name!r} is not an object')
            try:
                facts['level_names'].update(section.get('level_names') or [])
                for key in ('type_slugs', 'pairs', 'pairs_removed'):
                    facts[key].update(tuple(item) for item in (section.get(key) or []))
            except TypeError as e:
                raise ManifestUnusable(f'section {section_name!r} has malformed entries: {e}') from e

    changed = {key: sorted(values, key=lambda v: tuple('' if x is None else x for x in v)
                           if isinstance(v, tuple) else v)
               for key, values in facts.items()}
    changed['runs'] = sorted(runs)
    changed['earlier_runs'] = sorted(name for name in runs if name != run_id)
    return changed


def load_all():
    """Every recorded fact, without load()'s checks: the walkthrough pairs a full-surface
    purge adds, since the surface it derives from the DB can't name an old URL. Raises
    ManifestUnusable only when the file can't be read."""
    ledger, problem = _read()
    if ledger is None:
        raise ManifestUnusable(f'manifest is {problem}')
    return load_from(ledger)


def load_from(ledger):
    facts = {key: set() for key in FACT_KEYS}
    for run in ledger['runs'].values():
        for section in (run.values() if isinstance(run, dict) else ()):
            if not isinstance(section, dict):
                continue
            facts['level_names'].update(section.get('level_names') or [])
            for key in ('type_slugs', 'pairs', 'pairs_removed'):
                facts[key].update(tuple(item) for item in (section.get(key) or [])
                                  if isinstance(item, (list, tuple)))
    return {key: sorted(values, key=repr) for key, values in facts.items()}


def owed():
    """[(run id, [sections])] the ledger still owes a purge, for display. A file that can't
    be read shows as one entry saying so."""
    ledger, problem = _read()
    if ledger is None:
        return [(f'(manifest {problem})', [])]
    entries = [(name, sorted(run)) for name, run in sorted(ledger['runs'].items())
               if isinstance(run, dict)]
    if ledger['widen']:
        entries.append(('(an earlier record was unreadable: the purge covers everything)', []))
    return entries


def clear():
    """Remove the ledger. Only a purge prod_seed.py started calls this, once it succeeds."""
    try:
        MANIFEST_PATH.unlink()
    except FileNotFoundError:
        pass
