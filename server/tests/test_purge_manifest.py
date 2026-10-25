"""Unit tests for the purge ledger and the narrowed purge scope.

The ledger exists so the next run purges what an earlier run changed, and so a purge can be
smaller than the full surface. Both risks run the same way: a URL that should have been
purged and was not serves stale content for up to 30 days (s-maxage=30d). So what is pinned
here is that a record is never lost (other runs carry forward, a file that can't be read is
set aside rather than overwritten, a seeder run by hand never touches the file) and that
every ambiguity raises ManifestUnusable, whose answer is a full-surface purge.
"""
import json
from types import SimpleNamespace

import pytest

from scripts.cache import purge_manifest
from scripts.cache.purge_manifest import (
    SECTION_COLLECTIBLES, SECTION_WALKTHROUGHS, ManifestUnusable,
)
from scripts.cache.purge_api_cache import (
    PUBLIC_BASE, check_narrowed, derive_urls, has_changes, removed_detail_urls,
    scope_sources,
)

RUN = 'run-abc'


@pytest.fixture(autouse=True)
def isolated_manifest(tmp_path, monkeypatch):
    """Never touch the real ledger under scripts/cache/."""
    monkeypatch.setattr(purge_manifest, 'MANIFEST_PATH', tmp_path / 'purge-manifest.json')
    monkeypatch.delenv(purge_manifest.RUN_ID_ENV, raising=False)


def record_both(run, **facts):
    """What one run's two seeders record, each section with its own facts."""
    purge_manifest.record(SECTION_COLLECTIBLES, run, level_names=facts.get('level_names', ()),
                          type_slugs=facts.get('type_slugs', ()))
    purge_manifest.record(SECTION_WALKTHROUGHS, run, pairs=facts.get('pairs', ()),
                          pairs_removed=facts.get('pairs_removed', ()))


FACTS_ONLY = ('level_names', 'type_slugs', 'pairs', 'pairs_removed')


def facts(changed):
    return {key: changed[key] for key in FACTS_ONLY}


# --------------------------------------------------------------------------
# load(): the trustworthy cases

def test_explicitly_empty_change_set_is_trustworthy():
    """Both seeders recorded and genuinely changed nothing: nothing to purge."""
    record_both(RUN)
    changed = purge_manifest.load(RUN)
    assert facts(changed) == {'level_names': [], 'type_slugs': [], 'pairs': [], 'pairs_removed': []}
    assert changed['runs'] == [RUN] and changed['earlier_runs'] == []


def test_sections_are_merged():
    record_both(RUN, level_names=['Xion'], type_slugs=[('cans', 'collectibles')],
                pairs=[('main-story', 'alpha')])
    changed = purge_manifest.load(RUN)
    assert changed['level_names'] == ['Xion']
    assert changed['type_slugs'] == [('cans', 'collectibles')]
    assert changed['pairs'] == [('main-story', 'alpha')]


def test_an_earlier_runs_changes_carry_forward():
    """The re-run blind spot: a run that committed and then stopped (Redis, the purge, a
    Ctrl+C) must still be purged by the next run, whose own diff no longer sees it."""
    purge_manifest.record(SECTION_COLLECTIBLES, 'older-run', level_names=['Stale'])
    record_both(RUN, level_names=['Fresh'])
    changed = purge_manifest.load(RUN)
    assert changed['level_names'] == ['Fresh', 'Stale']
    assert changed['runs'] == ['older-run', RUN]
    assert changed['earlier_runs'] == ['older-run']


def test_recording_again_for_a_run_replaces_its_section():
    purge_manifest.record(SECTION_COLLECTIBLES, RUN, level_names=['First'])
    purge_manifest.record(SECTION_COLLECTIBLES, RUN, level_names=['Second'])
    purge_manifest.record(SECTION_WALKTHROUGHS, RUN)
    assert purge_manifest.load(RUN)['level_names'] == ['Second']


def test_a_load_without_a_run_id_returns_everything_owed():
    """prod_seed.py --purge-only has no seeders of its own: it purges what is owed."""
    purge_manifest.record(SECTION_COLLECTIBLES, 'older-run', level_names=['Stale'])
    changed = purge_manifest.load(None)
    assert changed['level_names'] == ['Stale'] and changed['earlier_runs'] == ['older-run']


def test_a_missing_ledger_owes_nothing_without_a_run_id():
    changed = purge_manifest.load(None)
    assert facts(changed) == {'level_names': [], 'type_slugs': [], 'pairs': [], 'pairs_removed': []}
    assert changed['runs'] == []


# --------------------------------------------------------------------------
# load(): every ambiguity must widen

def test_this_run_missing_a_section_is_unusable():
    """A seeder of this run that never recorded must not be read as "changed nothing"."""
    purge_manifest.record(SECTION_COLLECTIBLES, RUN, level_names=['Xion'])
    with pytest.raises(ManifestUnusable, match='recorded no walkthroughs'):
        purge_manifest.load(RUN)


def test_a_missing_ledger_is_unusable_for_a_run():
    with pytest.raises(ManifestUnusable, match='recorded no'):
        purge_manifest.load(RUN)


def test_corrupt_ledger_is_unusable():
    purge_manifest.MANIFEST_PATH.write_text('{not json', encoding='utf-8')
    with pytest.raises(ManifestUnusable, match='unreadable'):
        purge_manifest.load(RUN)


def test_unknown_section_is_unusable():
    purge_manifest.MANIFEST_PATH.write_text(
        json.dumps({'runs': {RUN: {'mystery': {}}}, 'widen': False}), encoding='utf-8')
    with pytest.raises(ManifestUnusable, match='unknown section'):
        purge_manifest.load(None)


# --------------------------------------------------------------------------
# record(): a record is never lost

def test_a_seeder_run_by_hand_never_touches_the_ledger():
    """No run id means a dev seed, or one run by hand: it must neither write a record a
    later prod purge could key off nor delete what an earlier prod run still owes."""
    purge_manifest.record(SECTION_COLLECTIBLES, 'older-run', level_names=['Owed'])
    before = purge_manifest.MANIFEST_PATH.read_bytes()
    purge_manifest.record(SECTION_COLLECTIBLES, None, level_names=['Dev'])
    purge_manifest.record(SECTION_WALKTHROUGHS, None, pairs=[('main-story', 'dev')])
    assert purge_manifest.MANIFEST_PATH.read_bytes() == before


def test_without_a_run_id_no_ledger_is_created():
    purge_manifest.record(SECTION_COLLECTIBLES, None, level_names=['Dev'])
    assert not purge_manifest.MANIFEST_PATH.exists()


def test_an_unreadable_ledger_is_set_aside_and_widens(capsys):
    """Overwriting it would drop whatever earlier runs it held, so it is moved aside, never
    deleted, and the next purge covers the full surface."""
    purge_manifest.MANIFEST_PATH.write_text('{not json', encoding='utf-8')
    record_both(RUN, level_names=['Xion'])
    aside = list(purge_manifest.MANIFEST_PATH.parent.glob('purge-manifest.json.unreadable-*'))
    assert len(aside) == 1 and aside[0].read_text(encoding='utf-8') == '{not json'
    assert 'moved to purge-manifest.json.unreadable-' in capsys.readouterr().out
    with pytest.raises(ManifestUnusable, match='unreadable or never completed'):
        purge_manifest.load(RUN)


def test_the_format_before_the_ledger_carries_forward_as_an_earlier_run():
    """A record left by the previous version of this file (a run whose purge failed)."""
    purge_manifest.MANIFEST_PATH.write_text(json.dumps({
        'run_id': 'v1-run',
        'sections': {
            'collectibles': {'status': 'complete', 'level_names': ['Xion'], 'type_slugs': [['cans', 'collectibles']]},
            'walkthroughs': {'status': 'complete', 'pairs': [['main-story', 'alpha']]},
        },
    }), encoding='utf-8')
    record_both(RUN)
    changed = purge_manifest.load(RUN)
    assert changed['level_names'] == ['Xion']
    assert changed['type_slugs'] == [('cans', 'collectibles')]
    assert changed['pairs'] == [('main-story', 'alpha')]
    assert changed['earlier_runs'] == ['v1-run']


def test_a_section_the_old_format_left_running_widens():
    """The old seeders committed in batches before recording, so a 'running' section means
    changes nobody wrote down."""
    purge_manifest.MANIFEST_PATH.write_text(json.dumps({
        'run_id': 'v1-run', 'sections': {'collectibles': {'status': 'running'}},
    }), encoding='utf-8')
    record_both(RUN)
    with pytest.raises(ManifestUnusable, match='never completed'):
        purge_manifest.load(RUN)


def test_owed_lists_runs_and_sections():
    purge_manifest.record(SECTION_COLLECTIBLES, 'older-run', level_names=['Stale'])
    record_both(RUN)
    assert purge_manifest.owed() == [('older-run', ['collectibles']),
                                     (RUN, ['collectibles', 'walkthroughs'])]


def test_owed_names_an_unreadable_ledger():
    purge_manifest.MANIFEST_PATH.write_text('{not json', encoding='utf-8')
    [(label, sections)] = purge_manifest.owed()
    assert 'unreadable' in label and sections == []


def test_clear_removes_and_is_idempotent():
    record_both(RUN, level_names=['Xion'])
    purge_manifest.clear()
    purge_manifest.clear()
    assert not purge_manifest.MANIFEST_PATH.exists()


# --------------------------------------------------------------------------
# scope_sources() / check_narrowed()

NAV = {
    'COLLECTIBLES': ['cans', 'memorysticks', 'supply-boxes'],
    'UPGRADES': ['gear'],
    'COSMETICS': ['glasses'],
    'WALKTHROUGHS': ['main-story', 'side-quests'],
}
DB = {
    'levels': ['eidos-7', 'xion'],
    'walkthrough_pairs': [('main-story', 'alpha'), ('side-quests', 'beta')],
    'walkthrough_types': ['main-story', 'side-quests'],
    'db_type_to_url': {'main-story': 'main-story', 'side-quest': 'side-quests'},
}
ROUTES = [
    SimpleNamespace(path='/api/collectibles/', methods={'GET'}),
    SimpleNamespace(path='/api/collectibles/{type_name}', methods={'GET'}),
    SimpleNamespace(path='/api/cosmetics/{type_name}', methods={'GET'}),
    SimpleNamespace(path='/api/levels/{level_name}', methods={'GET'}),
    SimpleNamespace(path='/api/walkthroughs/', methods={'GET'}),
    SimpleNamespace(path='/api/walkthroughs/{walkthrough_type}', methods={'GET'}),
    SimpleNamespace(path='/api/walkthroughs/{walkthrough_type}/{slug}', methods={'GET'}),
]

EMPTY = {'level_names': [], 'type_slugs': [], 'pairs': [], 'pairs_removed': []}


def narrowed_for(**changed):
    scoped_db, scoped_nav, index_prefixes, _removed = scope_sources({**EMPTY, **changed}, DB, NAV)
    return [u.replace(PUBLIC_BASE, '')
            for u in derive_urls(ROUTES, scoped_db, scoped_nav, index_prefixes)]


def narrow_and_check(**changed):
    """The exact sequence main() runs: scope, derive, then validate against the
    current surface plus recorded removals. Raises exactly when main() widens."""
    full = derive_urls(ROUTES, DB, NAV)
    scoped_db, scoped_nav, index_prefixes, removed = scope_sources({**EMPTY, **changed}, DB, NAV)
    narrowed = derive_urls(ROUTES, scoped_db, scoped_nav, index_prefixes)
    check_narrowed(narrowed, full, removed_detail_urls(ROUTES, removed, DB))
    return [u.replace(PUBLIC_BASE, '') for u in narrowed]


def test_one_changed_collectible_reaches_its_level_type_and_its_own_global_list():
    """The walkthrough index is NOT here: nothing in its domain changed, so
    purging it would evict a warm page on every collectible-only seed."""
    urls = narrowed_for(level_names=['Eidos 7'], type_slugs=[('cans', 'collectibles')])
    assert sorted(urls) == sorted([
        '/api/levels/eidos-7',
        '/api/collectibles/',
        '/api/collectibles/cans',
    ])


def test_collectible_only_change_leaves_the_walkthrough_index_alone():
    urls = narrowed_for(type_slugs=[('glasses', 'cosmetics')])
    assert '/api/collectibles/' in urls
    assert '/api/walkthroughs/' not in urls


def test_walkthrough_only_change_leaves_the_collectibles_index_alone():
    urls = narrowed_for(pairs=[('main-story', 'alpha')])
    assert '/api/walkthroughs/' in urls
    assert '/api/collectibles/' not in urls


def test_both_domains_changed_purges_both_indexes():
    urls = narrowed_for(level_names=['Xion'], type_slugs=[('cans', 'collectibles')],
                        pairs=[('main-story', 'alpha')])
    assert '/api/collectibles/' in urls
    assert '/api/walkthroughs/' in urls


def test_full_path_still_emits_every_index_unconditionally():
    """index_prefixes=None is the full-surface contract; the narrowing gate
    must not leak into it."""
    urls = [u.replace(PUBLIC_BASE, '') for u in derive_urls(ROUTES, DB, NAV)]
    assert '/api/collectibles/' in urls
    assert '/api/walkthroughs/' in urls


def test_category_group_selects_the_right_prefix():
    urls = narrowed_for(type_slugs=[('glasses', 'cosmetics')])
    assert '/api/cosmetics/glasses' in urls
    assert '/api/collectibles/glasses' not in urls


def test_null_category_group_resolves_as_collectibles():
    """Mirrors the app's own default for a NULL category_group."""
    urls = narrowed_for(type_slugs=[('cans', None)])
    assert '/api/collectibles/cans' in urls


def test_changed_walkthrough_reaches_its_detail_and_type_index():
    urls = narrowed_for(pairs=[('main-story', 'alpha')])
    assert '/api/walkthroughs/main-story/alpha' in urls
    assert '/api/walkthroughs/main-story' in urls
    assert '/api/walkthroughs/side-quests' not in urls


def test_db_mission_type_is_mapped_to_the_request_slug():
    """DB stores the singular 'side-quest'; the URL uses 'side-quests'."""
    urls = narrowed_for(pairs=[('side-quest', 'beta')])
    assert '/api/walkthroughs/side-quests/beta' in urls


def test_unknown_category_group_raises():
    with pytest.raises(RuntimeError, match='unknown category_group'):
        scope_sources({**EMPTY, 'type_slugs': [('cans', 'nonsense')]}, DB, NAV)


def test_retired_materials_group_narrows_to_collectibles():
    """Supply Boxes/Chests moved into collectibles; a manifest written by a seed
    that ran against a not-yet-flipped DB still says 'materials'. It must reach
    the moved page instead of widening to the full surface."""
    urls = narrowed_for(type_slugs=[('supply-boxes', 'materials')])
    assert '/api/collectibles/supply-boxes' in urls
    assert not any('/api/materials/' in u for u in urls)


def test_type_slug_absent_from_navigation_raises():
    with pytest.raises(RuntimeError, match='absent from navigation'):
        scope_sources({**EMPTY, 'type_slugs': [('ghosts', 'collectibles')]}, DB, NAV)


def test_unmapped_mission_type_raises():
    with pytest.raises(RuntimeError, match='no navigation slug'):
        scope_sources({**EMPTY, 'pairs': [('made-up', 'alpha')]}, DB, NAV)


def test_narrowed_is_a_subset_of_the_full_surface_when_nothing_was_removed():
    full = derive_urls(ROUTES, DB, NAV)
    scoped_db, scoped_nav, index_prefixes, removed = scope_sources(
        {**EMPTY, 'level_names': ['Xion'], 'type_slugs': [('gear', 'upgrades')],
         'pairs': [('main-story', 'alpha')]}, DB, NAV)
    narrowed = derive_urls(ROUTES, scoped_db, scoped_nav, index_prefixes)
    assert removed == set()
    assert set(narrowed) <= set(full)
    check_narrowed(narrowed, full, [])


def test_check_narrowed_rejects_urls_outside_the_full_surface():
    with pytest.raises(RuntimeError, match='neither in the current surface nor a recorded removal'):
        check_narrowed(['https://x/api/levels/ghost'], ['https://x/api/levels/xion'], [])


def test_check_narrowed_rejects_an_empty_set():
    with pytest.raises(RuntimeError, match='narrowed set is empty'):
        check_narrowed([], ['https://x/api/levels/xion'], [])


# ── deletions and renames: URLs that are gone from the DB but must be purged ─
#
# The subset check validates against a surface derived from the CURRENT DB. A
# deleted walkthrough is by definition not in it, and neither is the old half of
# a rename. Both are exactly what most needs purging (the origin 404s them; the
# edge still holds a warm 200), so the check must tolerate them — but only them.
# Before this, every seed that deleted content widened to a full purge and the
# error message blamed the mapping.

# Neither of these exists in DB['walkthrough_pairs'].
GONE = ('main-story', 'burning-xion')
GONE_URL = '/api/walkthroughs/main-story/burning-xion'


def test_manifest_round_trips_removed_pairs_separately():
    record_both(RUN, pairs=[('main-story', 'alpha')], pairs_removed=[GONE])
    changed = purge_manifest.load(RUN)
    assert changed['pairs'] == [('main-story', 'alpha')]
    assert changed['pairs_removed'] == [GONE]


def test_manifest_written_before_the_split_reads_as_no_removals():
    """An older manifest has no pairs_removed key. That is an empty set, not
    an unusable manifest — the key's absence carries no ambiguity."""
    purge_manifest.MANIFEST_PATH.write_text(
        '{"run_id": "run-abc", "sections": {"walkthroughs": '
        '{"status": "complete", "pairs": [["main-story", "alpha"]]}}}', encoding='utf-8')
    assert purge_manifest.load(None)['pairs_removed'] == []


def test_deleted_walkthrough_narrows_to_its_url_and_index_instead_of_widening():
    """The case from seed run 20260929-200647: 4 deleted walkthroughs widened
    to the full 127-URL surface. It must narrow to the deleted URL, its type
    index, and the global list."""
    urls = narrow_and_check(pairs_removed=[GONE])
    assert sorted(urls) == sorted([
        GONE_URL,
        '/api/walkthroughs/main-story',
        '/api/walkthroughs/',
    ])


def test_renamed_walkthrough_purges_both_the_old_and_the_new_url():
    """A rename records the new pair as changed and the old as removed; both
    URLs must be purged, and the old one must not trip the subset check."""
    urls = narrow_and_check(pairs=[('main-story', 'alpha')], pairs_removed=[GONE])
    assert '/api/walkthroughs/main-story/alpha' in urls
    assert GONE_URL in urls


def test_recategorised_walkthrough_purges_both_type_indexes():
    """Moving a walkthrough from one mission type to another stales the index
    it left as well as the one it joined.

    The new location must exist in the current surface (DB has
    side-quests/beta) — a *current* pair absent from the surface is exactly
    what the subset check is meant to reject, and it did, when an earlier
    version of this test used a location the fixture DB did not contain.
    """
    urls = narrow_and_check(pairs=[('side-quest', 'beta')],
                            pairs_removed=[('main-story', 'beta')])
    assert '/api/walkthroughs/side-quests/beta' in urls
    assert '/api/walkthroughs/main-story/beta' in urls
    assert '/api/walkthroughs/main-story' in urls
    assert '/api/walkthroughs/side-quests' in urls


def test_removed_detail_urls_derives_only_the_detail_pages():
    _, _, _, removed = scope_sources({**EMPTY, 'pairs_removed': [GONE]}, DB, NAV)
    urls = [u.replace(PUBLIC_BASE, '') for u in removed_detail_urls(ROUTES, removed, DB)]
    assert urls == [GONE_URL]


def test_a_genuinely_invented_url_still_widens():
    """Tolerating removals must not become tolerating anything. A URL that is
    neither in the surface nor a recorded removal is still a broken mapping."""
    full = derive_urls(ROUTES, DB, NAV)
    invented = [f'{PUBLIC_BASE}/api/walkthroughs/main-story/never-existed']
    with pytest.raises(RuntimeError, match='neither in the current surface nor a recorded removal'):
        check_narrowed(invented, full, removed_detail_urls(ROUTES, {('main-story', 'burning-xion')}, DB))


def test_removed_pair_with_unmappable_type_still_widens():
    """The removal path goes through the same type mapping as everything else;
    tolerance applies to the URL, not to the mapping that produced it."""
    with pytest.raises(RuntimeError, match='no navigation slug'):
        scope_sources({**EMPTY, 'pairs_removed': [('made-up', 'x')]}, DB, NAV)


def test_deletion_only_seed_counts_as_changes():
    """A seed that only deleted walkthroughs has no current-entity changes.
    Reading that as 'nothing to purge' would leave the deleted pages serving
    from the edge for 30 days."""
    assert has_changes({**EMPTY, 'pairs_removed': [GONE]}) is True
    assert has_changes(EMPTY) is False
    assert has_changes({'level_names': [], 'type_slugs': [], 'pairs': []}) is False  # pre-split shape
