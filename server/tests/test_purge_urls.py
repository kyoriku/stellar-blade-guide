"""Unit tests for the scoped-purge URL derivation
(scripts/cache/purge_api_cache.py). The derivation walks the route table, so
a new route under a cached prefix must appear automatically (or raise), and
routes outside the prefixes must be ignored."""
import os
import sys
from types import SimpleNamespace

import pytest
import requests

from scripts.cache import purge_api_cache
from scripts.cache.purge_api_cache import (
    PUBLIC_BASE, TransientPurgeError, derive_urls, purge, singular_walkthrough_urls,
)

DB = {
    'levels': ['eidos-7', 'nest'],
    'walkthrough_pairs': [('main-story', 'scavenger-adam'), ('side-quests', 'looking-at-you')],
    'walkthrough_types': ['main-story', 'side-quests'],
    'db_type_to_url': {'main-story': 'main-story', 'side-quest': 'side-quests'},
}
NAV = {
    'COLLECTIBLES': ['cans', 'memorysticks'],
    'UPGRADES': ['gear'],
    'COSMETICS': ['glasses'],
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
]


def test_full_expansion_counts():
    urls = derive_urls(BASE_ROUTES, DB, NAV)
    # 1 + 2 + 2 + 2 + 1 + 2 + 1 + 1
    assert len(urls) == 12
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


# ── One-time purge of the singular walkthrough spellings ─────────────────────
# Search and reply notifications used to link /walkthroughs/side-quest/..., the API
# answered it, and the edge cached it apart from the plural the seed purge refreshes.

def test_singular_walkthrough_urls_are_the_db_spelling_of_renamed_types():
    # main-story is spelled the same in the DB and in URLs, so it adds nothing.
    assert singular_walkthrough_urls(BASE_ROUTES, DB) == [
        f'{PUBLIC_BASE}/api/walkthroughs/side-quest',
        f'{PUBLIC_BASE}/api/walkthroughs/side-quest/looking-at-you',
    ]


def test_singular_walkthrough_urls_refuse_an_empty_set():
    same = {**DB, 'db_type_to_url': {'main-story': 'main-story', 'side-quests': 'side-quests'}}
    with pytest.raises(RuntimeError, match='spelled differently'):
        singular_walkthrough_urls(BASE_ROUTES, same)


def _stub_main(monkeypatch, argv):
    """Run main() against the fixture: routes, DB sources and Cloudflare are stand-ins."""
    monkeypatch.setitem(sys.modules, 'app.main', SimpleNamespace(app=SimpleNamespace(routes=BASE_ROUTES)))
    monkeypatch.setattr(purge_api_cache, 'parse_navigation', lambda: NAV)
    monkeypatch.setattr(purge_api_cache, 'load_db_sources', lambda: DB)
    monkeypatch.setattr(purge_api_cache, 'SANITY_FLOOR', 0)
    purged, cleared = [], []
    monkeypatch.setattr(purge_api_cache, 'purge', lambda urls: purged.extend(urls) or len(urls))
    monkeypatch.setattr(purge_api_cache.purge_manifest, 'clear', lambda: cleared.append(True))
    monkeypatch.setattr(sys, 'argv', ['purge_api_cache.py', *argv])
    return purged, cleared


def test_singular_flag_reads_prod_and_leaves_the_seed_manifest(monkeypatch, capsys):
    monkeypatch.setenv('PROD_DATABASE_URL', 'postgresql+asyncpg://seeder:hunter2@prod.example:5432/sbg')
    monkeypatch.setenv('DATABASE_URL', 'postgresql+asyncpg://dev.example/sbg')
    purged, cleared = _stub_main(monkeypatch, ['--singular-walkthroughs'])

    purge_api_cache.main()

    # The stale copies were cached from prod, so they are derived from prod.
    assert os.environ['DATABASE_URL'] == 'postgresql+asyncpg://seeder:hunter2@prod.example:5432/sbg'
    assert purged == [
        f'{PUBLIC_BASE}/api/walkthroughs/side-quest',
        f'{PUBLIC_BASE}/api/walkthroughs/side-quest/looking-at-you',
    ]
    # A pending seed manifest describes other URLs; this purge must not spend it.
    assert cleared == []
    out = capsys.readouterr().out
    assert 'seeder:*****@prod.example' in out and 'hunter2' not in out


def test_singular_flag_refuses_without_the_prod_database(monkeypatch):
    monkeypatch.delenv('PROD_DATABASE_URL', raising=False)
    _stub_main(monkeypatch, ['--singular-walkthroughs', '--dry-run'])
    with pytest.raises(RuntimeError, match='PROD_DATABASE_URL'):
        purge_api_cache.main()


class _Resp:
    def __init__(self, status_code, payload=None):
        self.status_code = status_code
        self._payload = payload or {}
        self.ok = 200 <= status_code < 300
        self.text = str(self._payload)

    def json(self):
        return self._payload


@pytest.fixture
def cf_env(monkeypatch):
    monkeypatch.setenv('CLOUDFLARE_ZONE_ID', 'zone-test')
    monkeypatch.setenv('CLOUDFLARE_API_TOKEN', 'token-test')


@pytest.mark.parametrize('failure', [
    lambda *a, **k: (_ for _ in ()).throw(requests.Timeout('slow')),
    lambda *a, **k: (_ for _ in ()).throw(requests.ConnectionError('reset')),
    lambda *a, **k: _Resp(408),
    lambda *a, **k: _Resp(429),
    lambda *a, **k: _Resp(500),
    lambda *a, **k: _Resp(503),
])
def test_retryable_failures_raise_transient(failure, cf_env, monkeypatch):
    """prod_seed.py retries exit 1 and only exit 1, so the split below is a
    contract between the two scripts, not an implementation detail."""
    monkeypatch.setattr(purge_api_cache.requests, 'post', failure)
    with pytest.raises(TransientPurgeError):
        purge(['https://example.test/api/levels/nest'])


@pytest.mark.parametrize('failure', [
    lambda *a, **k: _Resp(400),
    lambda *a, **k: _Resp(401),
    lambda *a, **k: _Resp(403),
    lambda *a, **k: _Resp(200, {'success': False, 'errors': ['rejected']}),
])
def test_permanent_failures_do_not_raise_transient(failure, cf_env, monkeypatch):
    """A bad token or a malformed batch fails identically on every attempt;
    raising Transient here would burn the retry budget before the fallback."""
    monkeypatch.setattr(purge_api_cache.requests, 'post', failure)
    with pytest.raises(RuntimeError) as excinfo:
        purge(['https://example.test/api/levels/nest'])
    assert not isinstance(excinfo.value, TransientPurgeError)


def test_missing_credentials_is_permanent(monkeypatch):
    monkeypatch.delenv('CLOUDFLARE_ZONE_ID', raising=False)
    monkeypatch.delenv('CLOUDFLARE_API_TOKEN', raising=False)
    with pytest.raises(RuntimeError) as excinfo:
        purge(['https://example.test/api/levels/nest'])
    assert not isinstance(excinfo.value, TransientPurgeError)


def test_purge_url_never_carries_the_zone_id_into_an_error(cf_env, monkeypatch):
    """raise_for_status() embeds the request URL, which contains the zone ID.
    The error text reaches prod_seed's log file, so it must stay clean."""
    monkeypatch.setattr(purge_api_cache.requests, 'post', lambda *a, **k: _Resp(403))
    with pytest.raises(RuntimeError) as excinfo:
        purge(['https://example.test/api/levels/nest'])
    assert 'zone-test' not in str(excinfo.value)
