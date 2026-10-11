"""
Tests for the rate limiter's key and configuration (app/core/security.py).

The limiter keys on the client address get_client_ip resolves: CF-Connecting-IP
when it holds an address (Cloudflare sets it on every proxied request and refuses
one a client sends), else the connection's client address, never empty. The key
widens IPv6 to its /64, counts one bucket per route however a URL is spelled
(key_style "endpoint"), and uses moving windows.

The suite runs with the limiter disabled (conftest.disable_rate_limits). The
behavioural tests opt back in with rate_limits_on, which counts in process memory,
and drive the real limiter object through a probe route decorated at module scope.
"""

import inspect

import pytest
from fastapi import APIRouter, FastAPI, Request
from httpx import ASGITransport, AsyncClient
from limits import parse_many
from limits.strategies import MovingWindowRateLimiter

# The routers register their limits on the shared limiter when imported.
import app.routers.auth  # noqa: F401
import app.routers.collectibles  # noqa: F401
import app.routers.comments  # noqa: F401
import app.routers.notifications  # noqa: F401
import app.routers.progress  # noqa: F401
import app.routers.search  # noqa: F401
import app.routers.users  # noqa: F401
import app.routers.walkthroughs  # noqa: F401
from app.core.security import cf_connecting_ip, get_client_ip, limiter, rate_limit_key
from app.middleware.rate_limit import setup_rate_limiter


def _request(headers: dict[str, str | bytes] | None = None, client=("127.0.0.1", 123)) -> Request:
    """A Request as uvicorn hands it over: header values arrive as latin-1 bytes."""
    raw = [
        (name.encode(), value if isinstance(value, bytes) else value.encode("latin-1"))
        for name, value in (headers or {}).items()
    ]
    scope = {"type": "http", "method": "GET", "path": "/", "headers": raw}
    if client is not None:
        scope["client"] = client
    return Request(scope)


# ── cf_connecting_ip ─────────────────────────────────────────────────────────

@pytest.mark.parametrize("value, expected", [
    ("203.0.113.7", "203.0.113.7"),
    ("203.0.113.7 \t", "203.0.113.7"),  # httptools, prod's parser, keeps trailing OWS
    ("2001:DB8::A", "2001:db8::a"),  # canonical form, so one address is one key
    ("::ffff:203.0.113.7", "::ffff:203.0.113.7"),
])
def test_cf_connecting_ip_returns_an_address_in_canonical_form(value, expected):
    assert cf_connecting_ip(_request({"cf-connecting-ip": value})) == expected


@pytest.mark.parametrize("value", [
    b"",
    b"\xa0203.0.113.7",  # str.strip() would trim NBSP and accept this
    b"203.0.113.7\x85",  # ... and NEL
    b"\xa0",
    b"010.1.1.1",  # leading zero
    b"fe80::1%eth0",  # a zone id is free text
    b"2001:db8::1%\x1b[2J",
    b"203.0.113.7, 198.51.100.1",
    b"not-an-ip",
])
def test_cf_connecting_ip_refuses_anything_but_a_bare_address(value):
    assert cf_connecting_ip(_request({"cf-connecting-ip": value})) is None


def test_cf_connecting_ip_is_none_without_the_header():
    assert cf_connecting_ip(_request()) is None


# ── get_client_ip ────────────────────────────────────────────────────────────

def test_get_client_ip_prefers_a_valid_cf_connecting_ip():
    assert get_client_ip(_request({"cf-connecting-ip": "203.0.113.7"})) == "203.0.113.7"


def test_get_client_ip_falls_back_to_the_connection_for_an_invalid_cf_value():
    assert get_client_ip(_request({"cf-connecting-ip": b"\xa0"})) == "127.0.0.1"


@pytest.mark.parametrize("name", ["x-real-ip", "fastly-client-ip", "x-forwarded-for"])
def test_get_client_ip_never_reads_other_forwarding_headers(name):
    # Each passes through Cloudflare with whatever the client wrote.
    assert get_client_ip(_request({name: "198.51.100.66"})) == "127.0.0.1"


@pytest.mark.parametrize("client", [None, ("", 0)])
def test_get_client_ip_is_never_empty(client):
    # slowapi skips the limit entirely for an empty key.
    assert get_client_ip(_request(client=client)) == "unknown"


# ── rate_limit_key ───────────────────────────────────────────────────────────

def test_ipv4_keys_as_itself():
    assert rate_limit_key(_request({"cf-connecting-ip": "203.0.113.7"})) == "203.0.113.7"


def test_ipv6_keys_as_its_64():
    assert rate_limit_key(_request({"cf-connecting-ip": "2001:db8:1:2:3:4:5:6"})) == "2001:db8:1:2::/64"


def test_addresses_in_one_64_share_a_key_and_a_neighbour_does_not():
    keys = {
        rate_limit_key(_request({"cf-connecting-ip": ip}))
        for ip in ("2001:db8:1:2::a", "2001:db8:1:2:ffff::b", "2001:db8:1:2:dead:beef:0:1")
    }
    assert keys == {"2001:db8:1:2::/64"}
    assert rate_limit_key(_request({"cf-connecting-ip": "2001:db8:1:3::a"})) == "2001:db8:1:3::/64"


def test_an_ipv4_mapped_address_keys_as_its_ipv4():
    # A naive /64 would put every mapped address in ::/64.
    assert rate_limit_key(_request({"cf-connecting-ip": "::ffff:203.0.113.7"})) == "203.0.113.7"
    assert rate_limit_key(_request({"cf-connecting-ip": "::ffff:198.51.100.9"})) == "198.51.100.9"


def test_a_zoned_peer_keys_as_its_64():
    assert rate_limit_key(_request(client=("fe80::1%eth0", 123))) == "fe80::/64"


@pytest.mark.parametrize("client", [("testclient", 50000), ("not an address", 0), None])
def test_anything_that_is_not_an_address_shares_one_bucket(client):
    # Raw text never reaches slowapi's unsanitised 429 log line as a key.
    assert rate_limit_key(_request(client=client)) == "unknown"


# ── configuration ────────────────────────────────────────────────────────────

def test_the_limiter_counts_per_route_in_moving_windows_on_the_client_key():
    assert limiter._key_style == "endpoint"
    assert isinstance(limiter._limiter, MovingWindowRateLimiter)
    assert limiter._key_func is rate_limit_key
    # slowapi passes the request only to a key function with a parameter of this
    # name; otherwise every limited route runs unlimited and then answers 500.
    assert "request" in inspect.signature(rate_limit_key).parameters


def _limits(endpoint: str) -> list:
    return [lim.limit for lim in limiter._route_limits[endpoint]]


def test_forgot_password_has_a_minute_limit_then_a_day_limit():
    # A typo in the string leaves a route silently unlimited (slowapi only logs it),
    # and the order matters: the first limit to fail stops the evaluation, so a
    # burst refused per minute never spends the day's budget.
    assert _limits("app.routers.auth.forgot_password") == parse_many("3/minute;30/day")


@pytest.mark.parametrize("endpoint", [
    "app.routers.progress.set_progress",
    "app.routers.progress.unset_progress",
    "app.routers.comments.get_comments",
    "app.routers.comments.delete_comment",
])
def test_routes_shared_across_every_id_allow_300_a_minute(endpoint):
    assert _limits(endpoint) == parse_many("300/minute")


def test_profile_updates_allow_5_a_minute():
    assert _limits("app.routers.users.update_me") == parse_many("5/minute")


# Every limited route, so a typo in any limit string (which slowapi only logs, leaving
# the route unlimited) or an unreviewed change fails here.
ROUTE_LIMITS = {
    "app.routers.auth.change_password": "10/minute",
    "app.routers.auth.discord_callback": "20/minute",
    "app.routers.auth.discord_login": "20/minute",
    "app.routers.auth.forgot_password": "3/minute;30/day",
    "app.routers.auth.google_callback": "20/minute",
    "app.routers.auth.google_login": "20/minute",
    "app.routers.auth.login": "10/minute",
    "app.routers.auth.logout": "30/minute",
    "app.routers.auth.logout_all": "10/minute",
    "app.routers.auth.refresh": "30/minute",
    "app.routers.auth.register": "5/minute",
    "app.routers.auth.reset_password": "10/minute",
    "app.routers.collectibles.get_all_collectibles": "100/minute",
    "app.routers.collectibles.get_collectibles_by_level": "100/minute",
    "app.routers.collectibles.get_collectibles_by_type": "100/minute",
    "app.routers.collectibles.get_cosmetics_by_type": "100/minute",
    "app.routers.collectibles.get_upgrades_by_type": "100/minute",
    "app.routers.comments.create_comment": "10/minute",
    "app.routers.comments.delete_comment": "300/minute",
    "app.routers.comments.get_comments": "300/minute",
    "app.routers.comments.update_comment": "20/minute",
    "app.routers.notifications.list_notifications": "100/minute",
    "app.routers.notifications.mark_all_read": "100/minute",
    "app.routers.notifications.mark_read": "100/minute",
    "app.routers.progress.get_progress": "100/minute",
    "app.routers.progress.set_progress": "300/minute",
    "app.routers.progress.sync_progress": "10/minute",
    "app.routers.progress.unset_progress": "300/minute",
    "app.routers.search.search": "30/minute",
    "app.routers.users.deactivate_user": "20/minute",
    "app.routers.users.delete_me": "5/minute",
    "app.routers.users.get_my_stats": "100/minute",
    "app.routers.users.update_me": "5/minute",
    "app.routers.users.update_user_role": "20/minute",
    "app.routers.walkthroughs.get_all_walkthroughs": "100/minute",
    "app.routers.walkthroughs.get_walkthrough_by_slug": "100/minute",
    "app.routers.walkthroughs.get_walkthroughs_by_type": "100/minute",
}


def test_every_route_limit_is_pinned():
    registered = {
        name: [lim.limit for lim in limits]
        for name, limits in limiter._route_limits.items()
        if name.startswith("app.routers.")
    }
    assert registered == {name: parse_many(value) for name, value in ROUTE_LIMITS.items()}


# ── behaviour on the real limiter (counted in memory) ───────────────────────

probe_router = APIRouter()


@probe_router.get("/probe/{item_id}")
@limiter.limit("2/minute")
async def probe(request: Request, item_id: int):
    return {"id": item_id}


def _client() -> AsyncClient:
    app = FastAPI()
    setup_rate_limiter(app)
    app.include_router(probe_router)
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def test_one_counter_per_route_however_the_id_is_spelled(rate_limits_on):
    async with _client() as c:
        codes = [(await c.get(path)).status_code for path in ("/probe/1", "/probe/2", "/probe/01")]
    assert codes == [200, 200, 429]


async def test_one_ipv6_64_shares_a_bucket(rate_limits_on):
    async with _client() as c:
        same = [
            (await c.get("/probe/1", headers={"cf-connecting-ip": ip})).status_code
            for ip in ("2001:db8:1:2::a", "2001:db8:1:2:ffff::b", "2001:db8:1:2::c")
        ]
        neighbour = (await c.get("/probe/1", headers={"cf-connecting-ip": "2001:db8:1:3::a"})).status_code
    assert same == [200, 200, 429]
    assert neighbour == 200


async def test_rotating_forwarding_headers_does_not_open_new_buckets(rate_limits_on):
    async with _client() as c:
        codes = [
            (await c.get("/probe/1", headers={name: f"198.51.100.{i}"})).status_code
            for i, name in enumerate(("x-real-ip", "fastly-client-ip", "x-forwarded-for"))
        ]
    assert codes == [200, 200, 429]


async def test_a_padded_cf_value_counts_under_the_connection(rate_limits_on):
    # An empty key would make slowapi skip the limit; a padded value is refused and
    # counted under the peer instead.
    async with _client() as c:
        codes = [
            (await c.get("/probe/1", headers={"cf-connecting-ip": b"\xa0203.0.113.7"})).status_code,
            (await c.get("/probe/1", headers={"cf-connecting-ip": b"203.0.113.7\x85"})).status_code,
            (await c.get("/probe/1")).status_code,
        ]
    assert codes == [200, 200, 429]
