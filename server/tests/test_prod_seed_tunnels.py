"""prod_seed.py's URL helpers, tunnel reminder and redaction, read from its source.

Importing prod_seed.py would load server/.env, check the prod variables and open a
seed log, so the functions under test are pulled out of the file with ast and run in
a namespace that holds only what they use. Every URL here is made up.
"""

import ast
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

import pytest

from scripts.db import check_connections as cc

PROD_SEED = Path(__file__).resolve().parent.parent / "scripts" / "prod_seed.py"
FUNCTIONS = {"_split_url", "_reading", "_url_problem", "_mask", "_url_secrets", "_tunnel_ports",
             "_tunnel_commands", "remind_to_close_tunnels", "_redact"}
CONSTANTS = {"TUNNEL_HOST", "TUNNEL_DEFAULT_PORTS"}

TUNNEL_DB = "postgresql://postgres:sekret-91@host.docker.internal:15432/railway"
TUNNEL_REDIS = "redis://default:sekret-91@host.docker.internal:16379"

# Shapes a hand-edited URL can take. SQLAlchemy ends a password at the FIRST '@'; redis-py
# ends the host part at the first '/', '?' or '#', then takes the credentials to the last '@'.
AWKWARD = [
    "postgresql://postgres:Ab3/sekret-91@host.docker.internal:15432/railway",
    "postgresql://postgres:Ab3?sekret-91@host.docker.internal:15432/railway",
    "postgresql://postgres:Ab3#sekret-91@host.docker.internal:15432/railway",
    "postgresql://postgres:Ab3@sekret-91@host.docker.internal:15432/railway",
    "postgresql://postgres:12/sekret-91@host.docker.internal:15432/railway",
    "redis://default:Ab3/sekret-91@host.docker.internal:16379",
    "redis://sekret-91@host.docker.internal:16379",                      # password, no user
    "postgresql://postgres:sekret-91host.docker.internal:15432/railway",  # dropped '@'
    "postgresql:/postgres:sekret-91@host.docker.internal:15432/railway",  # dropped '/'
    "redis://default:x[sekret-91@host.docker.internal:16379",
    "redis://default:sekret-91＠host.docker.internal:16379",          # fullwidth '@'
    "postgresql://postgres@host.docker.internal:15432/railway?password=sekret-91",
]
TWO_AT_PG = "postgresql://postgres:sekret-91@Qz7@host.docker.internal:15432/railway"
TWO_AT_REDIS = "redis://default:sekret-91@Qz7@host.docker.internal:16379"
SLASH_REDIS = "redis://default:4071/sekret-91@host.docker.internal:16379"   # redis-py: default:4071


def _name(url):
    return "Redis" if url.startswith("redis") else "Postgres"


class _Log:
    def __init__(self):
        self.lines = []

    def info(self, message):
        self.lines.append(message)


def _load(**globals_):
    tree = ast.parse(PROD_SEED.read_text(encoding="utf-8"))
    keep = [
        node for node in tree.body
        if (isinstance(node, ast.FunctionDef) and node.name in FUNCTIONS)
        or (isinstance(node, ast.Assign)
            and any(isinstance(t, ast.Name) and t.id in CONSTANTS for t in node.targets))
    ]
    found = {n.name for n in keep if isinstance(n, ast.FunctionDef)}
    assert found == FUNCTIONS, f"missing from prod_seed.py: {FUNCTIONS - found}"
    ns = {"urlsplit": urlsplit, "unquote": unquote, "parse_qs": parse_qs, "YELLOW": "",
          "RESET": "", "log": _Log(),
          "_stopped_at_check": False, "_SECRETS": [], **globals_}
    exec(compile(ast.Module(body=keep, type_ignores=[]), str(PROD_SEED), "exec"), ns)
    return ns


def test_both_urls_on_the_tunnel_host():
    ns = _load()
    assert ns["_tunnel_ports"]((("Postgres", TUNNEL_DB), ("Redis", TUNNEL_REDIS))) == [
        ("Postgres", 15432), ("Redis", 16379)]


def test_only_the_urls_on_the_tunnel_host_count():
    ns = _load()
    urls = (("Postgres", "postgresql://postgres:x@roundhouse.proxy.rlwy.net:40404/railway"),
            ("Redis", TUNNEL_REDIS))
    assert ns["_tunnel_ports"](urls) == [("Redis", 16379)]


def test_no_tunnel_host_means_none():
    ns = _load()
    urls = (("Postgres", "postgresql+asyncpg://postgres:postgres@postgres:5432/stellarblade"),
            ("Redis", "redis://redis:6379"))
    assert ns["_tunnel_ports"](urls) == []


def test_a_missing_or_malformed_port_is_skipped():
    ns = _load()
    urls = (("Postgres", "postgresql://postgres:x@host.docker.internal/railway"),
            ("Redis", "redis://default:x@host.docker.internal:notaport"))
    assert ns["_tunnel_ports"](urls) == []


def test_a_raw_slash_in_the_password_still_finds_the_tunnel():
    ns = _load()
    assert ns["_tunnel_ports"]((("Postgres", AWKWARD[0]),)) == [("Postgres", 15432)]


def test_a_url_the_check_stops_on_still_names_its_tunnel():
    # The reminder goes by the host as written: the tunnel was opened for it, whatever a
    # driver would make of the URL.
    ns = _load()
    assert ns["_tunnel_ports"]((("Postgres", TWO_AT_PG), ("Redis", SLASH_REDIS))) == [
        ("Postgres", 15432), ("Redis", 16379)]


def test_reminder_names_both_tunnels_and_their_ports():
    ns = _load(PROD_DATABASE_URL=TUNNEL_DB, PROD_REDIS_URL=TUNNEL_REDIS)
    ns["remind_to_close_tunnels"]()
    text = "\n".join(ns["log"].lines)
    assert "Close the Postgres and Redis tunnels with Ctrl+C in their tabs" in text
    assert "lsof -nP -iTCP:15432 -iTCP:16379 -sTCP:LISTEN" in text
    assert "sekret-91" not in text


def test_reminder_for_a_single_tunnel_is_singular():
    ns = _load(PROD_DATABASE_URL="postgresql://postgres:x@postgres:5432/stellarblade",
               PROD_REDIS_URL=TUNNEL_REDIS)
    ns["remind_to_close_tunnels"]()
    text = "\n".join(ns["log"].lines)
    assert "Close the Redis tunnel with Ctrl+C in its tab" in text
    assert "lsof -nP -iTCP:16379 -sTCP:LISTEN" in text


def test_reminder_after_a_stopped_check_doesnt_assume_the_tunnels_are_open():
    ns = _load(PROD_DATABASE_URL=TUNNEL_DB, PROD_REDIS_URL=TUNNEL_REDIS, _stopped_at_check=True)
    ns["remind_to_close_tunnels"]()
    text = "\n".join(ns["log"].lines)
    assert "If you opened a tunnel and aren't running this again now" in text
    assert "lsof -nP -iTCP:15432 -iTCP:16379 -sTCP:LISTEN" in text


def test_no_reminder_without_a_tunnel():
    ns = _load(PROD_DATABASE_URL="postgresql://postgres:x@postgres:5432/stellarblade",
               PROD_REDIS_URL="redis://redis:6379")
    ns["remind_to_close_tunnels"]()
    assert ns["log"].lines == []


def test_tunnel_commands_follow_the_env_ports():
    ns = _load(PROD_DATABASE_URL=TUNNEL_DB.replace(":15432", ":25432"),
               PROD_REDIS_URL="redis://redis:6379")
    assert ns["_tunnel_commands"]() == [
        "railway connect Postgres --tunnel-only -P 25432 --environment production 2>/dev/null",
        "railway connect Redis --tunnel-only -P 16379 --environment production 2>/dev/null",
    ]


def test_mask_shows_where_never_who():
    mask = _load()["_mask"]
    assert mask("Postgres", TUNNEL_DB) == "postgresql://*****@host.docker.internal:15432/railway"
    assert mask("Redis", TUNNEL_REDIS) == "redis://*****@host.docker.internal:16379"
    assert mask("Redis", "redis://redis:6379") == "redis://redis:6379"


def test_mask_shows_what_the_driver_reads_not_what_is_written():
    # SQLAlchemy keeps the host's case and reads a '#' into the database name; redis-py
    # reads the path as a db number.
    mask = _load()["_mask"]
    assert (mask("Postgres", "postgresql://postgres:x@Host.Docker.Internal:15432/rail#way")
            == "postgresql://*****@Host.Docker.Internal:15432/rail#way")
    assert (mask("Redis", "redis://default:x@host.docker.internal:16379/03")
            == "redis://*****@host.docker.internal:16379/3")


@pytest.mark.parametrize("name,url", [("Postgres", TWO_AT_PG), ("Redis", TWO_AT_REDIS)])
def test_mask_hides_a_url_with_more_than_one_at(name, url):
    # SQLAlchemy would look up "Qz7@host.docker.internal", part of the password.
    assert _load()["_mask"](name, url) == "(not shown: the URL has more than one @)"


def test_mask_hides_a_url_whose_driver_reads_another_host():
    assert (_load()["_mask"]("Redis", SLASH_REDIS)
            == "(not shown: redis-py reads a different host from the one written)")


@pytest.mark.parametrize("name", ["Postgres", "Redis"])
@pytest.mark.parametrize("url", AWKWARD + [TWO_AT_PG, TWO_AT_REDIS, SLASH_REDIS])
def test_mask_never_shows_a_password_and_never_raises(url, name):
    shown = _load()["_mask"](name, url)
    assert "sekret" not in shown and "Ab3" not in shown and "12/" not in shown
    assert "Qz7" not in shown and "4071" not in shown


# No credentials can be told apart in these two, so redaction can't find them; the
# header shows neither and the connection check stops on them before anything runs.
UNREDACTABLE = {AWKWARD[7], AWKWARD[10]}


@pytest.mark.parametrize("url", [u for u in AWKWARD if u not in UNREDACTABLE])
def test_redact_strips_every_credential_a_driver_could_quote(url):
    ns = _load()
    ns["_SECRETS"] = ns["_url_secrets"](url)
    assert "sekret-91" not in ns["_redact"](f"driver said: {url}")


@pytest.mark.parametrize("url", sorted(UNREDACTABLE))
def test_urls_with_no_findable_credentials_are_not_shown(url):
    driver = "redis-py" if _name(url) == "Redis" else "SQLAlchemy"
    assert _load()["_mask"](_name(url), url) == f"(not shown: {driver} can't parse the URL)"


PARITY = AWKWARD + [TUNNEL_DB, TUNNEL_REDIS, TWO_AT_PG, TWO_AT_REDIS, SLASH_REDIS,
                    "redis://redis:6379", "postgresql://postgres:x@[::1]:15432/railway",
                    "postgresql://postgres:x@Host.Docker.Internal:15432/rail#way",
                    "redis://default:x@host.docker.internal:16379/03"]


@pytest.mark.parametrize("url", PARITY)
def test_split_url_matches_check_connections(url):
    assert _load()["_split_url"](url) == cc.split_url(url)


@pytest.mark.parametrize("name", ["Postgres", "Redis"])
@pytest.mark.parametrize("url", PARITY)
def test_the_header_reads_each_url_as_the_check_does(url, name):
    ns = _load()
    assert ns["_reading"](name, url) == cc.reading(name, url)
    problem = cc.url_problem(name, url)
    assert ns["_url_problem"](name, url) == (problem[0] if problem else None)


# check_connections.mask and tunnel_commands show the other prod-reading scripts' URLs and
# tunnels; prod_seed.py keeps its own copies, which must say exactly the same.

MORE = [
    "postgresql://postgres@host.docker.internal:15432/railway",              # no password
    "redis://host.docker.internal:16379",                                    # no credentials
    "postgresql://postgres:sekret-91@[::1]:5432/railway",
    "postgresql+asyncpg://postgres:sekret-91@host.docker.internal/railway",  # no port
    "redis://default:sekret-91@host.docker.internal:16379/2",                # a db index
]


@pytest.mark.parametrize("name", ["Postgres", "Redis"])
@pytest.mark.parametrize("url", AWKWARD + MORE + [TUNNEL_DB, TUNNEL_REDIS, TWO_AT_PG, TWO_AT_REDIS,
                                                  SLASH_REDIS])
def test_check_connections_masks_every_url_as_prod_seed_does(url, name):
    assert cc.mask(name, url) == _load()["_mask"](name, url)


@pytest.mark.parametrize("db,cache", [
    (TUNNEL_DB, TUNNEL_REDIS),
    (TUNNEL_DB.replace(":15432", ":25432"), TUNNEL_REDIS.replace(":16379", ":26379")),
    (TUNNEL_DB.replace(":15432", ""), TUNNEL_REDIS.replace(":16379", "")),
])
def test_check_connections_names_the_tunnels_as_prod_seed_does(db, cache):
    ns = _load(PROD_DATABASE_URL=db, PROD_REDIS_URL=cache)
    assert cc.tunnel_commands([("Postgres", db), ("Redis", cache)]) == ns["_tunnel_commands"]()
