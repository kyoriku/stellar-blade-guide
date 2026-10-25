"""Unit tests for the scoped-purge URL derivation
(scripts/cache/purge_api_cache.py). The derivation walks the route table, so
a new route under a cached prefix must appear automatically (or raise), and
routes outside the prefixes must be ignored."""
import contextlib
import os
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path
from types import SimpleNamespace

import pytest
import requests

from scripts.cache import purge_api_cache, purge_manifest
from scripts.cache.purge_api_cache import (
    PUBLIC_BASE, TransientPurgeError, UrlListError, derive_urls, purge,
    singular_walkthrough_urls,
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
    monkeypatch.setattr(purge_api_cache.cc, 'require', lambda names, **kwargs: None)
    monkeypatch.setattr(sys, 'argv', ['purge_api_cache.py', *argv])
    return purged, cleared


def test_singular_flag_reads_prod_and_leaves_the_seed_manifest(monkeypatch, capsys):
    monkeypatch.setenv('PROD_DATABASE_URL', 'postgresql+asyncpg://seeder:hunter2@prod.example:5432/sbg')
    monkeypatch.setenv('DATABASE_URL', 'postgresql+asyncpg://dev.example/sbg')
    purged, cleared = _stub_main(monkeypatch, ['--singular-walkthroughs'])
    checked = []
    monkeypatch.setattr(purge_api_cache.cc, 'require',
                        lambda names, **kwargs: checked.append((names, os.environ['DATABASE_URL'])))

    purge_api_cache.main()

    # The stale copies were cached from prod, so they are derived from prod, after a check
    # that prod answers.
    assert os.environ['DATABASE_URL'] == 'postgresql+asyncpg://seeder:hunter2@prod.example:5432/sbg'
    assert checked == [(['Postgres'], 'postgresql+asyncpg://seeder:hunter2@prod.example:5432/sbg')]
    assert purged == [
        f'{PUBLIC_BASE}/api/walkthroughs/side-quest',
        f'{PUBLIC_BASE}/api/walkthroughs/side-quest/looking-at-you',
    ]
    # A pending seed manifest describes other URLs; this purge must not spend it.
    assert cleared == []
    out = capsys.readouterr().out
    assert '  Database: postgresql+asyncpg://*****@prod.example:5432/sbg' in out
    assert 'seeder' not in out and 'hunter2' not in out


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


# ── The ledger: what every purge owes, and who may clear it ──────────────────
# A record is only ever cleared by a purge prod_seed.py started (--clear-ledger), and a
# full-surface purge, which derives its list from the current DB, still reaches every
# walkthrough URL the ledger recorded: a renamed or deleted page's old URL is in no row.


RENAMED_AWAY = ('main-story', 'old-name')        # recorded by an earlier run, gone from DB
RENAMED_AWAY_URL = f'{PUBLIC_BASE}/api/walkthroughs/main-story/old-name'


@pytest.fixture
def ledger(tmp_path, monkeypatch):
    monkeypatch.setattr(purge_manifest, 'MANIFEST_PATH', tmp_path / 'purge-manifest.json')
    monkeypatch.delenv(purge_manifest.RUN_ID_ENV, raising=False)
    return purge_manifest


def _record_run(run, **facts):
    purge_manifest.record('collectibles', run, level_names=facts.get('level_names', ()))
    purge_manifest.record('walkthroughs', run, pairs=facts.get('pairs', ()),
                          pairs_removed=facts.get('pairs_removed', ()))


def _run_main(monkeypatch, argv):
    monkeypatch.setitem(sys.modules, 'app.main', SimpleNamespace(app=SimpleNamespace(routes=BASE_ROUTES)))
    monkeypatch.setattr(purge_api_cache, 'parse_navigation', lambda: NAV)
    monkeypatch.setattr(purge_api_cache, 'load_db_sources', lambda: DB)
    monkeypatch.setattr(purge_api_cache, 'SANITY_FLOOR', 0)
    purged = []
    monkeypatch.setattr(purge_api_cache, 'purge', lambda urls: purged.extend(urls) or len(urls))
    monkeypatch.setattr(sys, 'argv', ['purge_api_cache.py', *argv])
    purge_api_cache.main()
    return purged


def test_a_recorded_walkthrough_gone_from_the_db_is_purged_as_a_removal(ledger, monkeypatch):
    """An earlier run recorded a walkthrough a later run renamed: purge its URL, don't widen."""
    _record_run('older', pairs=[RENAMED_AWAY])
    _record_run('this', level_names=['Eidos 7'])
    purged = _run_main(monkeypatch, ['--run-id', 'this'])
    assert RENAMED_AWAY_URL in purged
    assert f'{PUBLIC_BASE}/api/levels/eidos-7' in purged
    assert f'{PUBLIC_BASE}/api/levels/nest' not in purged    # narrowed, not widened


def test_the_full_surface_by_request_carries_every_recorded_walkthrough(ledger, monkeypatch):
    _record_run('older', pairs_removed=[RENAMED_AWAY])
    purged = _run_main(monkeypatch, ['--all'])
    assert RENAMED_AWAY_URL in purged
    assert set(derive_urls(BASE_ROUTES, DB, NAV)) <= set(purged)


def test_a_widened_purge_carries_every_recorded_walkthrough(ledger, monkeypatch, capsys):
    """This run recorded only one section, so the purge widens, and the earlier run's removal
    must still be in it: the surface derived from the DB can't name it."""
    _record_run('older', pairs_removed=[RENAMED_AWAY])
    purge_manifest.record('collectibles', 'this', level_names=['Eidos 7'])
    purged = _run_main(monkeypatch, ['--run-id', 'this'])
    assert 'widening to the full surface' in capsys.readouterr().out
    assert RENAMED_AWAY_URL in purged


def test_a_recorded_walkthrough_with_no_url_fails_the_purge_and_keeps_the_ledger(ledger, monkeypatch):
    _record_run('older', pairs_removed=[('made-up-type', 'x')])
    before = purge_manifest.MANIFEST_PATH.read_bytes()
    with pytest.raises(UrlListError, match='maps to no URL'):
        _run_main(monkeypatch, ['--all', '--clear-ledger'])
    assert purge_manifest.MANIFEST_PATH.read_bytes() == before


def test_a_purge_run_by_hand_never_clears_the_ledger(ledger, monkeypatch, capsys):
    _record_run('older', level_names=['Eidos 7'])
    _run_main(monkeypatch, [])
    assert purge_manifest.MANIFEST_PATH.exists()
    assert 'only a purge prod_seed.py starts clears it' in capsys.readouterr().out


def test_a_purge_prod_seed_started_clears_the_ledger(ledger, monkeypatch):
    _record_run('this', level_names=['Eidos 7'])
    _run_main(monkeypatch, ['--run-id', 'this', '--clear-ledger'])
    assert not purge_manifest.MANIFEST_PATH.exists()


def test_a_dry_run_never_clears(ledger, monkeypatch):
    _record_run('this', level_names=['Eidos 7'])
    _run_main(monkeypatch, ['--run-id', 'this', '--clear-ledger', '--dry-run'])
    assert purge_manifest.MANIFEST_PATH.exists()


def test_earlier_runs_are_named(ledger, monkeypatch, capsys):
    _record_run('older', level_names=['Nest'])
    _record_run('this', level_names=['Eidos 7'])
    _run_main(monkeypatch, ['--run-id', 'this'])
    assert 'includes earlier run(s) not yet purged: older' in capsys.readouterr().out


# ── The script's own exits, in a real process ────────────────────────────────


SERVER = Path(purge_api_cache.__file__).resolve().parents[2]


def _run_script(database_url, no_answer_seconds=None, answer_seconds=None):
    """Run purge_api_cache.py as __main__ against database_url. A shorter watchdog limit, or
    a shorter asyncpg timeout, can be set first; the script is run by path, exactly as
    prod_seed.py runs it."""
    setup = 'import scripts.db.seed_guard as g\n'
    if no_answer_seconds is not None:
        setup += f'g.NO_ANSWER_SECONDS = {no_answer_seconds}\n'
    if answer_seconds is not None:
        setup += f'g.ANSWER_SECONDS = {answer_seconds}\n'
    script = setup + "import runpy\nrunpy.run_path('scripts/cache/purge_api_cache.py', run_name='__main__')\n"
    env = {**os.environ, 'DATABASE_URL': database_url}
    env.pop('SEED_RUN_ID', None)
    return subprocess.run([sys.executable, '-c', script], capture_output=True, text=True,
                          timeout=60, cwd=SERVER, env=env, check=False)


def test_a_database_that_refuses_ends_the_purge_before_anything_is_purged():
    with socket.socket() as probe:              # a port nothing listens on
        probe.bind(('127.0.0.1', 0))
        port = probe.getsockname()[1]
    done = _run_script(f'postgresql+asyncpg://u:p@127.0.0.1:{port}/db')
    assert done.returncode == 2
    assert "Couldn't build the URL list" in done.stdout and 'Nothing was purged' in done.stdout


@contextlib.contextmanager
def _silent_database():
    """The dead-tunnel shape: a port that accepts every connection and never answers."""
    listener = socket.socket()
    listener.bind(('127.0.0.1', 0))
    listener.listen()
    held = []
    stop = threading.Event()

    def hold_connections():
        listener.settimeout(0.2)
        while not stop.is_set():
            try:
                held.append(listener.accept()[0])
            except OSError:
                continue

    thread = threading.Thread(target=hold_connections, daemon=True)
    thread.start()
    try:
        yield f'postgresql+asyncpg://u:p@127.0.0.1:{listener.getsockname()[1]}/db'
    finally:
        stop.set()
        thread.join()
        for conn in held:
            conn.close()
        listener.close()


def test_a_database_that_never_answers_is_ended_by_the_watchdog():
    with _silent_database() as url:
        started = time.monotonic()
        done = _run_script(url, no_answer_seconds=1)
        elapsed = time.monotonic() - started
    assert done.returncode == 2
    assert 'No answer from the database' in done.stdout and 'nothing was purged' in done.stdout
    assert elapsed < 20


def test_a_connection_that_never_opens_names_the_timeout():
    """asyncpg gives up on the connection before the watchdog fires; the line says what timed
    out rather than a bare TimeoutError."""
    with _silent_database() as url:
        done = _run_script(url, answer_seconds=1)
    assert done.returncode == 2
    assert ("Couldn't build the URL list: no answer from the database within 1 s. "
            "Nothing was purged.") in done.stdout
