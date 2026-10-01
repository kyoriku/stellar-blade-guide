"""Unit tests for the changed-entity manifest and the narrowed purge scope.

The manifest exists to make a purge smaller, and the whole risk of making a
purge smaller is making it too small: a URL that should have been purged and
was not serves stale content for up to 30 days (s-maxage=30d). So most of what
is pinned here is the *widening* behaviour — every way the manifest can be
ambiguous must raise ManifestUnusable, because the caller's response to that is
to purge the full surface.
"""
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
    """Never touch the real manifest under scripts/cache/."""
    monkeypatch.setattr(purge_manifest, 'MANIFEST_PATH', tmp_path / 'purge-manifest.json')
    monkeypatch.delenv(purge_manifest.RUN_ID_ENV, raising=False)


# --------------------------------------------------------------------------
# load(): every ambiguity must widen

def test_missing_manifest_is_unusable():
    with pytest.raises(ManifestUnusable, match='missing'):
        purge_manifest.load(RUN)


def test_no_run_id_is_unusable():
    """A purge with no run id cannot prove a manifest belongs to it."""
    purge_manifest.complete(SECTION_COLLECTIBLES, RUN, level_names=['Xion'])
    with pytest.raises(ManifestUnusable, match='no run id'):
        purge_manifest.load(None)


def test_run_id_mismatch_is_unusable():
    """The stale-manifest case: a previous run's changed set must never be
    purged in place of this run's."""
    purge_manifest.complete(SECTION_COLLECTIBLES, RUN, level_names=['Xion'])
    with pytest.raises(ManifestUnusable, match='belongs to run'):
        purge_manifest.load('a-different-run')


def test_corrupt_manifest_is_unusable():
    purge_manifest.MANIFEST_PATH.write_text('{not json', encoding='utf-8')
    with pytest.raises(ManifestUnusable):
        purge_manifest.load(RUN)


def test_section_that_began_but_never_completed_is_unusable():
    """A seeder that crashed partway leaves 'running'. Its changes are real but
    unrecorded, so trusting the other section would under-purge."""
    purge_manifest.complete(SECTION_COLLECTIBLES, RUN, level_names=['Xion'])
    purge_manifest.begin(SECTION_WALKTHROUGHS, RUN)
    with pytest.raises(ManifestUnusable, match='never completed'):
        purge_manifest.load(RUN)


def test_unknown_status_is_unusable():
    purge_manifest.MANIFEST_PATH.write_text(
        '{"run_id": "run-abc", "sections": {"collectibles": {"status": "weird"}}}',
        encoding='utf-8')
    with pytest.raises(ManifestUnusable, match='unknown status'):
        purge_manifest.load(RUN)


def test_unknown_section_is_unusable():
    purge_manifest.MANIFEST_PATH.write_text(
        '{"run_id": "run-abc", "sections": {"mystery": {"status": "complete"}}}',
        encoding='utf-8')
    with pytest.raises(ManifestUnusable, match='unknown section'):
        purge_manifest.load(RUN)


def test_no_sections_is_unusable():
    purge_manifest.MANIFEST_PATH.write_text(
        '{"run_id": "run-abc", "sections": {}}', encoding='utf-8')
    with pytest.raises(ManifestUnusable, match='no sections'):
        purge_manifest.load(RUN)


# --------------------------------------------------------------------------
# load(): the trustworthy cases

def test_explicitly_empty_change_set_is_trustworthy():
    """The one case that legitimately purges nothing: both seeders completed and
    genuinely changed nothing. Distinct from absence, which raises."""
    purge_manifest.complete(SECTION_COLLECTIBLES, RUN)
    purge_manifest.complete(SECTION_WALKTHROUGHS, RUN)
    changed = purge_manifest.load(RUN)
    assert changed == {'level_names': [], 'type_slugs': [], 'pairs': [], 'pairs_removed': []}


def test_sections_are_merged():
    purge_manifest.complete(SECTION_COLLECTIBLES, RUN,
                            level_names=['Xion'], type_slugs=[('cans', 'collectibles')])
    purge_manifest.complete(SECTION_WALKTHROUGHS, RUN, pairs=[('main-story', 'alpha')])
    changed = purge_manifest.load(RUN)
    assert changed['level_names'] == ['Xion']
    assert changed['type_slugs'] == [('cans', 'collectibles')]
    assert changed['pairs'] == [('main-story', 'alpha')]


def test_begin_discards_a_previous_runs_manifest():
    purge_manifest.complete(SECTION_COLLECTIBLES, 'older-run', level_names=['Stale'])
    purge_manifest.begin(SECTION_COLLECTIBLES, RUN)
    purge_manifest.complete(SECTION_COLLECTIBLES, RUN, level_names=['Fresh'])
    assert purge_manifest.load(RUN)['level_names'] == ['Fresh']


def test_unorchestrated_seed_leaves_no_manifest():
    """A seeder run by hand has no run id, so it must not leave a manifest a
    later purge could key off."""
    purge_manifest.complete(SECTION_COLLECTIBLES, 'older-run', level_names=['Stale'])
    purge_manifest.begin(SECTION_COLLECTIBLES, None)
    assert not purge_manifest.MANIFEST_PATH.exists()


def test_clear_removes_and_is_idempotent():
    purge_manifest.complete(SECTION_COLLECTIBLES, RUN, level_names=['Xion'])
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
    purge_manifest.complete(SECTION_WALKTHROUGHS, RUN,
                            pairs=[('main-story', 'alpha')], pairs_removed=[GONE])
    changed = purge_manifest.load(RUN)
    assert changed['pairs'] == [('main-story', 'alpha')]
    assert changed['pairs_removed'] == [GONE]


def test_manifest_written_before_the_split_reads_as_no_removals():
    """An older manifest has no pairs_removed key. That is an empty set, not
    an unusable manifest — the key's absence carries no ambiguity."""
    purge_manifest.MANIFEST_PATH.write_text(
        '{"run_id": "run-abc", "sections": {"walkthroughs": '
        '{"status": "complete", "pairs": [["main-story", "alpha"]]}}}', encoding='utf-8')
    assert purge_manifest.load(RUN)['pairs_removed'] == []


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
