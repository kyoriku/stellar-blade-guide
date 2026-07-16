"""Unit tests for the scoped-purge URL derivation
(scripts/cache/purge_api_cache.py). The derivation walks the route table, so
a new route under a cached prefix must appear automatically (or raise), and
routes outside the prefixes must be ignored."""
from types import SimpleNamespace

import pytest

from scripts.cache.purge_api_cache import PUBLIC_BASE, derive_urls

DB = {
    'levels': ['eidos-7', 'nest'],
    'walkthrough_pairs': [('main-story', 'scavenger-adam'), ('side-quests', 'looking-at-you')],
    'walkthrough_types': ['main-story', 'side-quests'],
}
NAV = {
    'COLLECTIBLES': ['cans', 'memorysticks'],
    'UPGRADES': ['gear'],
    'COSMETICS': ['glasses'],
    'MATERIALS': ['supply-boxes'],
}


def route(path, methods=frozenset({'GET'})):
    return SimpleNamespace(path=path, methods=methods)


BASE_ROUTES = [
    route('/api/walkthroughs/'),
    route('/api/walkthroughs/{walkthrough_type}'),
    route('/api/walkthroughs/{walkthrough_type}/{slug}'),
    route('/api/levels/{level_name}'),
    route('/api/collectibles/'),
    route('/api/collectibles/{type_name}'),
    route('/api/upgrades/{type_name}'),
    route('/api/cosmetics/{type_name}'),
    route('/api/materials/{type_name}'),
]


def test_full_expansion_counts():
    urls = derive_urls(BASE_ROUTES, DB, NAV)
    # 1 + 2 + 2 + 2 + 1 + 2 + 1 + 1 + 1
    assert len(urls) == 13
    assert f'{PUBLIC_BASE}/api/levels/eidos-7' in urls
    assert f'{PUBLIC_BASE}/api/walkthroughs/side-quests/looking-at-you' in urls
    assert f'{PUBLIC_BASE}/api/collectibles/memorysticks' in urls


def test_new_route_under_cached_prefix_appears_automatically():
    urls = derive_urls(BASE_ROUTES + [route('/api/levels/{level_name}/summary')], DB, NAV)
    assert f'{PUBLIC_BASE}/api/levels/nest/summary' in urls


def test_route_outside_cached_prefixes_is_ignored():
    urls = derive_urls(BASE_ROUTES + [route('/api/search/'), route('/api/comments/{id}')], DB, NAV)
    assert not any('/api/search' in u or '/api/comments' in u for u in urls)


def test_unrecognized_cached_route_shape_raises():
    with pytest.raises(RuntimeError, match='unrecognized shape'):
        derive_urls(BASE_ROUTES + [route('/api/collectibles/{type_name}/{extra}')], DB, NAV)


def test_non_get_routes_are_ignored():
    urls = derive_urls([route('/api/levels/{level_name}', methods=frozenset({'POST'}))], DB, NAV)
    assert urls == []
