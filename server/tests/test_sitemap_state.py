"""Unit tests for the sitemap lastmod state transition
(scripts/generate_sitemap.py). lastmod must track content changes, not
generation time: an unchanged page keeps its stored date, a changed or new
page stamps today, and pages that leave the sitemap leave the state."""
from scripts.generate_sitemap import resolve_lastmod

TODAY = '2026-07-16'


def test_missing_sidecar_stamps_all_today():
    lastmods, state = resolve_lastmod({}, {'/a': 'h1', '/b': 'h2'}, TODAY)
    assert lastmods == {'/a': TODAY, '/b': TODAY}
    assert state == {
        '/a': {'hash': 'h1', 'lastmod': TODAY},
        '/b': {'hash': 'h2', 'lastmod': TODAY},
    }


def test_unchanged_hash_keeps_stored_lastmod():
    prev = {'/a': {'hash': 'h1', 'lastmod': '2026-01-01'}}
    lastmods, state = resolve_lastmod(prev, {'/a': 'h1'}, TODAY)
    assert lastmods == {'/a': '2026-01-01'}
    assert state == {'/a': {'hash': 'h1', 'lastmod': '2026-01-01'}}


def test_changed_hash_stamps_today():
    prev = {'/a': {'hash': 'h1', 'lastmod': '2026-01-01'}}
    lastmods, state = resolve_lastmod(prev, {'/a': 'h2'}, TODAY)
    assert lastmods == {'/a': TODAY}
    assert state == {'/a': {'hash': 'h2', 'lastmod': TODAY}}


def test_disappeared_url_dropped_from_state():
    prev = {
        '/a': {'hash': 'h1', 'lastmod': '2026-01-01'},
        '/gone': {'hash': 'h9', 'lastmod': '2026-01-01'},
    }
    lastmods, state = resolve_lastmod(prev, {'/a': 'h1'}, TODAY)
    assert '/gone' not in state
    assert '/gone' not in lastmods
    assert state == {'/a': {'hash': 'h1', 'lastmod': '2026-01-01'}}
