"""
Tests for GET /api/search/ and the search service behind it.

Testing approach:
    Route: `_execute_search` is monkeypatched for the route tests. The statement is
    Postgres-only (tsvector columns, pg_trgm, jsonb), so it can't run on SQLite;
    scripts/search_eval.py checks it against the real database.
    Validation (422) tests don't touch the DB at all: FastAPI validates query
    params before the route body executes.

    Service: `_execute_search` gets a fake session that answers the search
    statement with prepared rows shaped like its output, and the vocabulary query
    with titles. These pin the links, snippets and the typo re-run.

    Redis: FakeRedis via the autouse `patch_redis` fixture in conftest.py.

    HTTP client: minimal FastAPI app with the search router only, matching the
    pattern established in conftest.py.
"""

import json
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI

from app.core.navigation import NAV_LEVEL_SLUGS
from app.db.database import get_db
from app.middleware.error_handler import add_error_handler_middleware
from app.middleware.rate_limit import setup_rate_limiter
from app.middleware.security_headers import add_security_headers_middleware
from app.routers import search as search_route
from app.schemas.search import SearchResult
from app.services import search as search_service
from app.services.search import _execute_search

# Characters kept out of the source as literals.
NBSP = chr(0xA0)
IDEOGRAPHIC_SPACE = chr(0x3000)
ZERO_WIDTH_SPACE = chr(0x200B)
STAR = chr(0x2605)
DOT = chr(0xB7)          # joins a snippet's type, place and cycle tags


def fullwidth(text):
    """ASCII letters as their full-width forms (NFKC folds them back)."""
    return "".join(chr(ord(c) - 0x61 + 0xFF41) if "a" <= c <= "z" else c for c in text)


@pytest_asyncio.fixture
async def search_client():
    app = FastAPI()
    setup_rate_limiter(app)
    app.include_router(search_route.router, prefix="/api")

    mock_db = AsyncMock()

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ---------------------------------------------------------------------------
# Validation — FastAPI rejects these before the route body runs
# ---------------------------------------------------------------------------

async def test_query_missing_returns_422(search_client):
    """q is required."""
    response = await search_client.get("/api/search/")
    assert response.status_code == 422


async def test_query_too_short_returns_422(search_client):
    """q must be at least 2 characters."""
    response = await search_client.get("/api/search/?q=a")
    assert response.status_code == 422


async def test_limit_zero_returns_422(search_client):
    """limit must be >= 1."""
    response = await search_client.get("/api/search/?q=eidos&limit=0")
    assert response.status_code == 422


async def test_limit_too_large_returns_422(search_client):
    """limit must be <= 50."""
    response = await search_client.get("/api/search/?q=eidos&limit=51")
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# No results
# ---------------------------------------------------------------------------

async def test_no_results_returns_empty_list(search_client, monkeypatch):
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=([], None)))

    response = await search_client.get("/api/search/?q=xyzzy")

    assert response.status_code == 200
    assert response.json() == {"query": "xyzzy", "total": 0, "results": [], "corrected": None}


async def test_special_chars_only_returns_200(search_client, monkeypatch):
    """Special-char queries are valid: they hold no word, so nothing matches."""
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=([], None)))

    response = await search_client.get("/api/search/?q=!!!")

    assert response.status_code == 200
    assert response.json()["total"] == 0


async def test_query_with_nothing_searchable_skips_cache_and_db(search_client, fake_redis, monkeypatch):
    """Two zero-width spaces pass the 2-character check but normalize to nothing:
    the route answers empty without a Redis or DB round trip, and caches nothing."""
    mock_execute = AsyncMock(side_effect=AssertionError("_execute_search must not run for an empty query"))
    monkeypatch.setattr(search_route, "_execute_search", mock_execute)

    response = await search_client.get("/api/search/", params={"q": ZERO_WIDTH_SPACE * 2})

    assert response.status_code == 200
    assert response.json() == {"query": "", "total": 0, "results": [], "corrected": None}
    mock_execute.assert_not_called()
    assert await fake_redis.keys("search:*") == []


async def test_query_with_a_control_character_skips_cache_and_db(search_client, fake_redis, monkeypatch):
    mock_execute = AsyncMock(side_effect=AssertionError("_execute_search must not run"))
    monkeypatch.setattr(search_route, "_execute_search", mock_execute)

    response = await search_client.get("/api/search/", params={"q": "na\x01no"})

    assert response.status_code == 200
    assert response.json()["total"] == 0
    mock_execute.assert_not_called()
    assert await fake_redis.keys("search:*") == []


# ---------------------------------------------------------------------------
# Result shape
# ---------------------------------------------------------------------------

async def test_result_shape(search_client, monkeypatch):
    """Each result has exactly the fields defined by SearchResult."""
    results = [
        SearchResult(
            kind="level",
            id=1,
            title="Eidos 7",
            snippet=None,
            navigation_url="/levels/eidos-7",
            score=0.9,
        ),
        SearchResult(
            kind="collectible",
            id=42,
            title="Memorystick",
            snippet="Found near the entrance.",
            navigation_url="/levels/eidos-7",
            score=0.5,
        ),
    ]
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=(results, None)))

    response = await search_client.get("/api/search/?q=eidos")

    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "eidos"
    assert data["total"] == 2
    assert data["corrected"] is None

    first = data["results"][0]
    assert set(first.keys()) == {"kind", "id", "title", "snippet", "navigation_url", "score"}
    assert first["kind"] == "level"
    assert first["title"] == "Eidos 7"
    assert first["navigation_url"] == "/levels/eidos-7"
    assert isinstance(first["score"], float)


async def test_query_is_normalised_in_response(search_client, monkeypatch):
    """q is lowercased and stripped before being echoed in the response."""
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=([], None)))

    response = await search_client.get("/api/search/?q=EIDOS")

    assert response.status_code == 200
    assert response.json()["query"] == "eidos"


@pytest.mark.parametrize("raw", [
    fullwidth("nano") + " suit",
    "nano" + IDEOGRAPHIC_SPACE + "suit",
    "nano" + NBSP + "suit",
    "na" + ZERO_WIDTH_SPACE + "no  suit ",
])
async def test_query_is_normalised_like_plain_text(search_client, monkeypatch, raw):
    """Full-width letters, ideographic and no-break spaces and zero-width characters
    all search (and cache, and log) as the plain text they look like."""
    mock_execute = AsyncMock(return_value=([], None))
    monkeypatch.setattr(search_route, "_execute_search", mock_execute)

    response = await search_client.get("/api/search/", params={"q": raw})

    assert response.json()["query"] == "nano suit"
    assert mock_execute.call_args.args[1] == "nano suit"


async def test_corrected_query_is_returned(search_client, monkeypatch):
    results = [SearchResult(kind="walkthrough", id=1, title="Boss: Scarlet", snippet=None,
                            navigation_url="/walkthroughs/nikke-dlc/boss-scarlet", score=4.5)]
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=(results, "boss challenge")))

    response = await search_client.get("/api/search/?q=boss+challgen")

    assert response.json()["corrected"] == "boss challenge"
    assert response.json()["query"] == "boss challgen"


# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------

async def test_cache_miss_populates_cache(search_client, fake_redis, monkeypatch):
    """On a cache miss the route queries the DB and writes results to Redis."""
    results = [
        SearchResult(
            kind="level", id=1, title="Eidos 7", snippet=None,
            navigation_url="/levels/eidos-7", score=0.9,
        )
    ]
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=(results, None)))

    assert await fake_redis.get("search:eidos:20:v2") is None

    response = await search_client.get("/api/search/?q=eidos")
    assert response.status_code == 200

    cached = json.loads(await fake_redis.get("search:eidos:20:v2"))
    assert cached == response.json()


async def test_cache_hit_skips_execute(search_client, fake_redis, monkeypatch):
    """On a cache hit the route returns cached data without calling _execute_search."""
    cached_data = {"query": "eidos", "total": 0, "results": [], "corrected": None}
    await fake_redis.set("search:eidos:20:v2", json.dumps(cached_data))

    mock_execute = AsyncMock(
        side_effect=AssertionError("_execute_search must not be called on a cache hit")
    )
    monkeypatch.setattr(search_route, "_execute_search", mock_execute)

    response = await search_client.get("/api/search/?q=eidos")

    assert response.status_code == 200
    assert response.json() == cached_data
    mock_execute.assert_not_called()


async def test_unversioned_key_from_before_the_rework_is_never_read(search_client, fake_redis, monkeypatch):
    """The old image keeps writing search:{q}:{limit} while it drains; the new one
    must not serve those, since their results came from the old ranking."""
    await fake_redis.set("search:eidos:20", json.dumps({"query": "eidos", "total": 0, "results": []}))
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=([], None)))

    await search_client.get("/api/search/?q=eidos")

    search_route._execute_search.assert_awaited_once()


async def test_cached_response_from_before_corrected_existed_still_validates(search_client, fake_redis):
    """A cached dict without `corrected` goes back through the response model on a
    hit; the field is optional, so it can't 500."""
    await fake_redis.set("search:eidos:20:v2", json.dumps({"query": "eidos", "total": 0, "results": []}))

    response = await search_client.get("/api/search/?q=eidos")

    assert response.status_code == 200
    assert response.json()["corrected"] is None


# ---------------------------------------------------------------------------
# A failing search
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def guarded_search_client():
    """The search router behind the real error handler and security headers, in the
    production order (security headers outermost)."""
    app = FastAPI()
    setup_rate_limiter(app)
    app.include_router(search_route.router, prefix="/api")
    add_error_handler_middleware(app)
    add_security_headers_middleware(app)

    mock_db = AsyncMock()

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_failed_search_is_a_500_that_nothing_keeps(guarded_search_client, fake_redis, monkeypatch):
    """A failing statement used to come back as an empty result, cached for an hour.
    Now it raises: the client gets a 500 that neither Redis, Cloudflare nor the
    browser keeps (no-store, no max-age, no s-maxage), so the next request retries."""
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(side_effect=RuntimeError("statement failed")))

    response = await guarded_search_client.get("/api/search/?q=eidos")

    assert response.status_code == 500
    cache_control = response.headers["cache-control"]
    assert cache_control == "no-store"
    assert "max-age" not in cache_control and "s-maxage" not in cache_control
    assert await fake_redis.keys("search:*") == []


async def test_successful_search_keeps_its_cache_headers(guarded_search_client, monkeypatch):
    """The other half of the contract above: a 200 is still cacheable for the TTL."""
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=([], None)))

    response = await guarded_search_client.get("/api/search/?q=eidos")

    assert response.status_code == 200
    assert "s-maxage" in response.headers["cache-control"]


# ── access-log cache column ──────────────────────────────────────────────────

@pytest_asyncio.fixture
async def search_probe_client():
    """Search app with a probe recording request.state the way the access log
    reads it. Registered before the first request, since Starlette refuses new
    middleware once an app has started."""
    app = FastAPI()
    setup_rate_limiter(app)
    app.include_router(search_route.router, prefix="/api")
    seen = {}

    @app.middleware("http")
    async def probe(request, call_next):
        response = await call_next(request)
        seen["cache_status"] = getattr(request.state, "cache_status", None)
        seen["db_time"] = getattr(request.state, "db_time", None)
        seen["search_query"] = getattr(request.state, "search_query", None)
        seen["search_total"] = getattr(request.state, "search_total", None)
        seen["search_corrected"] = getattr(request.state, "search_corrected", None)
        return response

    mock_db = AsyncMock()

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c, seen


async def test_search_reports_cache_status_on_miss_then_hit(search_probe_client, monkeypatch):
    """Without this the search line logs a blank cache column, which reads as
    'not cached at all' rather than 'cached, and this is which way it went'."""
    client, seen = search_probe_client
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=([], None)))

    await client.get("/api/search/?q=nano")
    assert seen["cache_status"] == "MISS"
    assert seen["db_time"] is not None

    await client.get("/api/search/?q=nano")
    assert seen["cache_status"] == "HIT"
    assert seen["db_time"] is None


# ── access-log search text ───────────────────────────────────────────────────
#
# The logging middleware never reads the query string: the OAuth callbacks carry
# their authorization `code` there, so search opts in by handing its own text
# over on request.state. These pin the hand-off; the rendering (sanitising, the
# 40-char cap, last-field placement) is pinned in test_logging.py.

async def test_search_hands_normalised_query_and_total_to_the_access_log(search_probe_client, monkeypatch):
    """The logged text is the cache-key text, so identical lines mean an identical
    key. The HIT branch reads the total back out of the cached dict — a separate
    code path from the MISS branch, hence both requests."""
    client, seen = search_probe_client
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=([], None)))

    await client.get("/api/search/", params={"q": "  NaNo "})
    assert seen["cache_status"] == "MISS"
    assert seen["search_query"] == "nano"
    assert seen["search_total"] == 0

    await client.get("/api/search/", params={"q": "  NaNo "})
    assert seen["cache_status"] == "HIT"
    assert seen["search_query"] == "nano"
    assert seen["search_total"] == 0


async def test_search_total_counts_results(search_probe_client, monkeypatch):
    client, seen = search_probe_client
    results = [
        SearchResult(
            kind="cosmetics", id=i, title=f"Nano Suit {i}", snippet=None,
            navigation_url="/cosmetics/nano-suits", score=0.5,
        )
        for i in range(3)
    ]
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=(results, None)))

    await client.get("/api/search/?q=nano+suit")
    assert seen["search_query"] == "nano suit"
    assert seen["search_total"] == 3


async def test_search_hands_the_corrected_query_to_the_access_log(search_probe_client, monkeypatch):
    """On the MISS that ran the typo fallback and on the HIT that reads it back, so a
    corrected query never hides a content gap in the log."""
    client, seen = search_probe_client
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=([], "boss challenge")))

    await client.get("/api/search/?q=boss+challgen")
    assert seen["cache_status"] == "MISS"
    assert seen["search_corrected"] == "boss challenge"

    await client.get("/api/search/?q=boss+challgen")
    assert seen["cache_status"] == "HIT"
    assert seen["search_corrected"] == "boss challenge"


async def test_rejected_search_hands_nothing_to_the_access_log(search_probe_client):
    """Accepted blind spot: validation (and the rate limiter) answer before the
    handler body runs, so a 422/429 line carries no search text."""
    client, seen = search_probe_client

    r = await client.get("/api/search/?q=a")
    assert r.status_code == 422
    assert seen["search_query"] is None
    assert seen["search_total"] is None


# ---------------------------------------------------------------------------
# The service: _execute_search against a fake session
# ---------------------------------------------------------------------------
# The statement is Postgres-only, so these hand _execute_search a session that answers
# it with prepared rows, one list per call, shaped like its output. They pin what the
# Python side does with them: links, snippets, anchors and the typo re-run.

class _FakeSession:
    """Answers the search statement with prepared row lists, in call order, and the
    vocabulary query with titles. Records every call."""

    def __init__(self, *search_rows, vocab=()):
        self.search_rows = list(search_rows)
        self.vocab = vocab
        self.calls = []

    async def execute(self, stmt, params=None):
        self.calls.append((stmt, params))
        if stmt is search_service._SEARCH_SQL:
            rows = self.search_rows.pop(0) if self.search_rows else []
        elif stmt is search_service._VOCAB_SQL:
            rows = [(title,) for title in self.vocab]
        else:
            raise AssertionError(f"unexpected statement: {stmt}")
        result = MagicMock()
        result.mappings.return_value.all.return_value = rows
        result.all.return_value = rows
        return result


def _row(kind, id, title, *, a=None, b=None, type_id=None, tier=4, description=None, cycle="Base",
         type_name=None, level_name=None, location_name=None, subtitle=None, available_after=None,
         content=None, extra=None, n=None, stems=None):
    """One result row of the search statement (part 0)."""
    return {"part": 0, "kind": kind, "id": id, "title": title, "a": a, "b": b, "type_id": type_id,
            "tier": tier, "score": tier + 0.5, "description": description, "cycle": cycle,
            "type_name": type_name, "level_name": level_name, "location_name": location_name,
            "subtitle": subtitle, "available_after": available_after, "content": content, "extra": extra,
            "n": n, "k1": 0, "k2": 0, "k3": 0, "stems": stems}


def _slug_row(type_id, id, title):
    """One row of a matched type's full title list, in page order (part 1)."""
    return {"part": 1, "kind": "slug", "id": id, "title": title, "type_id": type_id, "tier": None,
            "stems": None}


def _stems(*words):
    """The statement's stems column: each typed word with its English lexemes."""
    return [[w, [w]] for w in words]


async def test_walkthrough_results_link_the_navigation_spelling():
    # The DB stores side-quest; the page lives at side-quests. Linking the DB value let
    # the edge cache a copy the seed purge never refreshes, so a search click could show
    # a walkthrough's pre-edit text for up to 30 days.
    rows = [
        _row("walkthrough", 1, "Looking At You", a="side-quest", b="looking-at-you", subtitle="A side quest"),
        _row("walkthrough", 2, "Missing Husband", a="bulletin-board-request", b="missing-husband", subtitle="A request"),
        _row("walkthrough", 3, "Scavenger Adam", a="main-story", b="scavenger-adam", subtitle="The story"),
    ]
    results, corrected = await _execute_search(_FakeSession(rows), "q", 20)
    assert [r.navigation_url for r in results] == [
        "/walkthroughs/side-quests/looking-at-you",
        "/walkthroughs/bulletin-board-requests/missing-husband",
        "/walkthroughs/main-story/scavenger-adam",
    ]
    assert [r.snippet for r in results] == ["A side quest", "A request", "The story"]
    assert corrected is None


async def test_hidden_pseudo_levels_are_never_candidates():
    # Default and Boss Challenge are levels in the DB with no page of their own: a result
    # for either linked to a 404. The statement only builds level pages from nav_levels.
    session = _FakeSession([])
    await _execute_search(session, "boss challenge", 20)
    nav_levels = session.calls[0][1]["nav_levels"]
    assert nav_levels == sorted(NAV_LEVEL_SLUGS)
    assert "default" not in nav_levels and "boss-challenge" not in nav_levels


async def test_each_kind_links_its_page_and_says_what_it_is():
    rows = [
        _row("type", 18, "Nano Suits", a="cosmetics", b="nano-suits", n=126),
        _row("walkthrough_type", 2, "Side Quests", a="side-quests", b="side-quest", n=35),
        _row("walkthrough_type", 4, "NieR: Automata DLC", a="nier-dlc", b="nier-dlc", n=1),
        _row("level", 2, "Eidos 7", a="eidos-7", n=139),
        _row("item", 501, "Black Pearl", a="cosmetics", b="nano-suits", type_id=18,
             description={"type": "text", "content": "Buy it from Lyle."}),
    ]
    session = _FakeSession(rows + [_slug_row(18, 500, "Raven Suit"), _slug_row(18, 501, "Black Pearl")])
    results, _ = await _execute_search(session, "pearl", 20)
    by_title = {r.title: r for r in results}

    assert by_title["Nano Suits"].kind == "type"
    assert by_title["Nano Suits"].navigation_url == "/cosmetics/nano-suits"
    assert by_title["Nano Suits"].snippet == "126 nano suits"
    assert by_title["Side Quests"].kind == "walkthrough_type"
    assert by_title["Side Quests"].navigation_url == "/walkthroughs/side-quests"
    assert by_title["Side Quests"].snippet == "35 walkthroughs"
    assert by_title["NieR: Automata DLC"].snippet == "1 walkthrough"
    assert by_title["Eidos 7"].kind == "level"
    assert by_title["Eidos 7"].navigation_url == "/levels/eidos-7"
    assert by_title["Eidos 7"].snippet == "139 collectibles"
    assert by_title["Black Pearl"].kind == "cosmetics"
    assert by_title["Black Pearl"].navigation_url == "/cosmetics/nano-suits#black-pearl"
    assert by_title["Black Pearl"].snippet == "Buy it from Lyle."


async def test_duplicate_titles_link_their_positional_anchor():
    """Two "Body Core" entries render as #body-core-1 and #body-core-2 on the type page;
    the slug rows give the page order the suffixes follow."""
    rows = [_row("item", 22, "Body Core", a="upgrades", b="body-cores", type_id=9)]
    slugs = [_slug_row(9, 21, "Body Core"), _slug_row(9, 22, "Body Core")]
    results, _ = await _execute_search(_FakeSession(rows + slugs), "body core", 20)
    assert results[0].navigation_url == "/upgrades/body-cores#body-core-2"


async def test_body_hit_in_a_titled_section_links_that_section():
    content = [
        {"order": 1, "section_title": "Arrival", "text": "Talk to the guard."},
        {"order": 2, "section_title": "Finding Frank's Bag", "text": "The omnibolt sits behind the crates."},
    ]
    rows = [_row("walkthrough", 7, "Lost Device", a="side-quest", b="lost-device", tier=2,
                 content=content, extra=[], subtitle="Find it", stems=_stems("omnibolt"))]
    results, _ = await _execute_search(_FakeSession(rows), "omnibolt", 20)
    assert results[0].navigation_url == "/walkthroughs/side-quests/lost-device#finding-franks-bag"
    assert results[0].snippet.startswith("Finding Frank's Bag: ")
    assert "omnibolt" in results[0].snippet[:search_service.VISIBLE]


async def test_body_hit_in_an_untitled_section_links_section_order():
    content = [
        {"order": 1, "text": "Nothing here."},
        {"order": 2, "text": "The omnibolt sits behind the crates."},
    ]
    rows = [_row("walkthrough", 7, "Lost Device", a="side-quest", b="lost-device", tier=2,
                 content=content, extra=[], subtitle="Find it", stems=_stems("omnibolt"))]
    results, _ = await _execute_search(_FakeSession(rows), "omnibolt", 20)
    assert results[0].navigation_url == "/walkthroughs/side-quests/lost-device#section-2"
    assert results[0].snippet.startswith("The omnibolt")


@pytest.mark.parametrize("content, extra, available_after, expected", [
    # 1. a matching section wins
    ([{"order": 1, "section_title": "Cave", "text": "Grab the omnibolt."}], ["An omnibolt reward"],
     "After omnibolt quest", "Cave: Grab the omnibolt."),
    # 2. no section matches: a matching objective or reward
    ([{"order": 1, "text": "Nothing here."}], ["Find the cat", "Omnibolt x3"], "After omnibolt quest",
     "Omnibolt x3"),
    # 3. neither: a matching available_after
    ([{"order": 1, "text": "Nothing here."}], ["Find the cat"], "After the omnibolt quest",
     "After the omnibolt quest"),
    # 4. none of those: the subtitle
    ([{"order": 1, "text": "Nothing here."}], ["Find the cat"], "Never", "The subtitle"),
])
async def test_walkthrough_snippet_fallback_order(content, extra, available_after, expected):
    rows = [_row("walkthrough", 7, "Lost Device", a="side-quest", b="lost-device", tier=2, content=content,
                 extra=extra, available_after=available_after, subtitle="The subtitle",
                 stems=_stems("omnibolt"))]
    results, _ = await _execute_search(_FakeSession(rows), "omnibolt", 20)
    assert results[0].snippet.endswith(expected)


@pytest.mark.parametrize("cycle, place_matches, expected_tag", [
    ("Base", False, f"Earrings {DOT} Buy them."),
    ("NG", False, f"Earrings {DOT} Buy them."),           # the base cycle once the rename lands
    ("NG+", False, f"Earrings {DOT} NG+ {DOT} Buy them."),
    ("NG+", True, f"Earrings {DOT} Eidos 7 {DOT} NG+ {DOT} Buy them."),
])
async def test_item_found_by_type_place_or_cycle_says_so(cycle, place_matches, expected_tag):
    """When the description doesn't hold the match, the snippet names the type, the
    place a query word matched and a non-base cycle before the description."""
    rows = [_row("item", 9, "Ruby Drop", a="cosmetics", b="earrings", type_id=3, tier=2,
                 description={"type": "text", "content": "Buy them."}, cycle=cycle, type_name="Earrings",
                 level_name="Eidos 7", location_name="Silent Street",
                 stems=_stems("eidos" if place_matches else "earrings"))]
    results, _ = await _execute_search(_FakeSession(rows), "x y", 20)
    assert results[0].snippet == expected_tag


async def test_item_description_match_shows_the_fragment():
    rows = [_row("item", 9, "Supply Chest", a="collectibles", b="supply-chests", type_id=7, tier=2,
                 description={"type": "text", "content": "In the Opera House. Contains 3 Omnibolts."},
                 type_name="Supply Chest", stems=_stems("omnibolt"))]
    results, _ = await _execute_search(_FakeSession(rows), "omnibolt", 20)
    assert "Omnibolts" in results[0].snippet[:search_service.VISIBLE]


async def test_item_list_description_match_shows_the_fragment():
    """A list description is searched item by item, like the index reads it."""
    rows = [_row("item", 9, "Gear", a="upgrades", b="gear", type_id=5, tier=2,
                 description={"type": "list", "items": ["Open the gate.", "Grab the omnibolt inside."]},
                 type_name="Gear", stems=_stems("omnibolt"))]
    results, _ = await _execute_search(_FakeSession(rows), "omnibolt", 20)
    assert "omnibolt" in results[0].snippet[:search_service.VISIBLE]


async def test_star_titles_keep_their_star_slug():
    rows = [_row("item", 3, f"Training Gear {STAR * 2}", a="upgrades", b="gear", type_id=5)]
    results, _ = await _execute_search(_FakeSession(rows), "training gear", 20)
    assert results[0].navigation_url == "/upgrades/gear#training-gear-2"


async def test_typo_fallback_reruns_with_the_corrected_query():
    """Nothing held every word (only partial, tier-1 rows): the vocabulary is read,
    "challgen" becomes "challenge" because both words share a title, and the search
    runs again; its results win and the correction comes back."""
    partial = [_row("walkthrough", 1, "Boss: Scarlet", a="nikke-dlc", b="boss-scarlet", tier=1, subtitle="x")]
    full = [_row("walkthrough", 1, "Boss: Scarlet", a="nikke-dlc", b="boss-scarlet", tier=4, subtitle="x")]
    session = _FakeSession(partial, full, vocab=["Boss Challenge", "Boss: Scarlet"])

    results, corrected = await _execute_search(session, "boss challgen", 20)

    assert corrected == "boss challenge"
    statements = [stmt for stmt, _ in session.calls]
    assert statements == [search_service._SEARCH_SQL, search_service._VOCAB_SQL, search_service._SEARCH_SQL]
    assert session.calls[2][1]["q"] == "boss challenge"
    assert [r.title for r in results] == ["Boss: Scarlet"]


async def test_typo_fallback_keeps_the_first_results_when_the_rerun_is_no_better():
    partial = [_row("walkthrough", 1, "Boss: Scarlet", a="nikke-dlc", b="boss-scarlet", tier=1, subtitle="x")]
    session = _FakeSession(partial, partial, vocab=["Boss Challenge", "Boss: Scarlet"])

    results, corrected = await _execute_search(session, "boss challgen", 20)

    assert corrected is None
    assert [r.title for r in results] == ["Boss: Scarlet"]


async def test_full_matches_skip_the_typo_fallback():
    rows = [_row("walkthrough", 1, "Boss: Scarlet", a="nikke-dlc", b="boss-scarlet", tier=4, subtitle="x")]
    session = _FakeSession(rows, vocab=["Boss Challenge"])
    await _execute_search(session, "boss challgen", 20)
    assert [stmt for stmt, _ in session.calls] == [search_service._SEARCH_SQL]


async def test_a_failing_statement_raises():
    """No more swallowing a source's error into an empty result: the route turns the
    exception into an uncached 500 (test_failed_search_is_a_500_that_nothing_keeps)."""
    class _Broken:
        async def execute(self, stmt, params=None):
            raise RuntimeError("statement failed")

    with pytest.raises(RuntimeError):
        await _execute_search(_Broken(), "eidos", 20)


@pytest.mark.parametrize("q", ["", "!!!", "((:*", "na\x01no"])
async def test_queries_with_nothing_to_search_make_no_db_call(q):
    session = _FakeSession()
    results, corrected = await _execute_search(session, q, 20)
    assert (results, corrected) == ([], None)
    assert session.calls == []
