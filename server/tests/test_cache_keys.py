"""
Pure tests for the cache-key helpers in app/core/cache.py.

A key must be exactly as canonical as the lookup behind it. Level and type
resolution is case-insensitive and treats '-' and ' ' alike, so cache_slug
collapses those spellings onto one 30-day payload key. Walkthrough resolution is
exact and case-sensitive, so walkthrough_cache_keys passes the segments through
untouched: canonicalising there would serve a warm-cache 200 for a spelling the
DB 404s.

walkthrough_cache_keys is also the single place the detail key shape lives. The
API route and the SPA head injection (app/seo_head.py) both call it; the
source-grep test below fails if either grows an inline key again.

search_cache_key does the same for the search route, and carries the version
that lets a deploy change results without a flush.
"""
import re
from pathlib import Path

import app.routers.search as search_router
import app.routers.walkthroughs as walkthroughs_router
import app.seo_head as seo_head
from app.core.cache import cache_slug, search_cache_key, walkthrough_cache_keys


def test_cache_slug_lowercases_and_hyphenates():
    assert cache_slug("DOCUMENTS") == "documents"
    assert cache_slug("Eidos 7") == "eidos-7"
    assert cache_slug("EIDOS 7") == "eidos-7"


def test_cache_slug_is_identity_for_canonical_input():
    for slug in ("documents", "eidos-7", "bulletin-board-requests", "main-story"):
        assert cache_slug(slug) == slug


def test_walkthrough_cache_keys_pass_segments_through_untouched():
    # Pre-existing key shape, byte for byte — test_seo_head.py seeds these literally.
    assert walkthrough_cache_keys("main-story", "warm-me") == (
        "walkthrough:main-story:warm-me",
        "walkthrough:miss:main-story:warm-me",
    )
    # No canonicalisation: resolution is exact, so the key must be too.
    key, miss = walkthrough_cache_keys("Main-Story", "Detail Slug")
    assert key == "walkthrough:Main-Story:Detail Slug"
    assert miss == "walkthrough:miss:Main-Story:Detail Slug"


def test_walkthrough_key_shape_is_not_rebuilt_inline():
    # Narrow on purpose: only string literals starting with "walkthrough:" in the
    # two modules that consume the shared key. ("walkthroughs:type:" is a
    # different key and does not match.)
    inline = re.compile(r"""['"]walkthrough:""")
    for module in (walkthroughs_router, seo_head):
        source = Path(module.__file__).read_text(encoding="utf-8")
        assert not inline.search(source), f"{module.__name__} builds a walkthrough key inline"


def test_search_cache_key_shape():
    # Byte for byte: e2e/helpers/db.ts searchKey() builds the same key to clear it,
    # so a version bump changes both.
    assert search_cache_key("nano", 20) == "search:nano:20:v3"
    assert search_cache_key("new game plus", 50) == "search:new game plus:50:v3"


def test_no_search_key_can_be_read_as_an_unversioned_one():
    """The image from before the versions reads search:{q}:{limit}. A versioned key ends
    in ":v" and the version, never in ":" and digits alone, so whatever the query, the two
    never share an entry; a "search:v2:" prefix would have, for the query "v2:nano"."""
    old_shape = re.compile(r"search:.*:\d+")
    for q in ("nano", "v2:nano", "nano:20", "nano:20:v1", ":", "a:1:v2", "a:1:v3"):
        for limit in (1, 20, 50):
            assert not old_shape.fullmatch(search_cache_key(q, limit))


def test_search_key_shape_is_not_rebuilt_inline():
    source = Path(search_router.__file__).read_text(encoding="utf-8")
    assert not re.search(r"""['"]search:""", source), "the search router builds its key inline"
