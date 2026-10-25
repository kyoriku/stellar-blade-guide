"""
The one place search decides which text a page is found by
(app/services/search_text.py): the stored column expressions, their Python twin, the
DDL that keeps the columns current, and too_deep, which the walkthrough seeder runs
before it writes (tests/test_seed_walkthroughs.py).

The expressions are Postgres-only (jsonpath, tsvector), so they are pinned here by their
text: every jsonpath strict and behind its type guards, nothing Postgres would refuse in
a generated column, each deny list where it belongs. scripts/search_eval.py evaluates
them on every real row and checks them against the twin. The twin, the DDL planner and
the depth guard are pure and run here directly; seed_db's wiring runs on a fake
connection, and the rest of seed_db is read from its source.
"""
import ast
import hashlib
import itertools
import random
import re
from collections import Counter
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.services import search_text
from app.services.search_text import (
    BASE_CYCLES, COLLECTIBLE_VECTOR, COLUMN_STATE_SQL, MAX_DEPTH, NESTED_DENY, RETIRED_SEARCH_INDEXES,
    SEARCH_COLUMNS, SECTION_DENY, SECTION_PATHS, WALKTHROUGH_VECTOR, column_tag, plan_search_columns,
    section_strings, too_deep,
)
from scripts.db import seed_db

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"


# ---------------------------------------------------------------------------
# The expressions
# ---------------------------------------------------------------------------

def test_the_cycle_part_leaves_out_both_base_cycle_spellings():
    """Today's "Base" and the planned "NG": indexing "NG" would put every
    first-playthrough item under "ng+" and "new game plus"."""
    assert set(BASE_CYCLES) == {"Base", "NG"}
    part = re.search(r"setweight\(to_tsvector\('simple', CASE WHEN cycle NOT IN \(([^)]*)\) "
                     r"THEN cycle ELSE '' END\), 'C'\)", COLLECTIBLE_VECTOR)
    assert part, "the cycle part is missing"
    assert {value.strip().strip("'") for value in part.group(1).split(",")} == set(BASE_CYCLES)
    # The cycle is read nowhere else in the expression.
    assert len(re.findall(r"\bcycle\b", COLLECTIBLE_VECTOR)) == 2


_DENIED = re.compile(r'@\.key != "([^"]+)"')


def test_section_paths_cover_every_container_sequence_down_to_max_depth():
    assert len(SECTION_PATHS) == len(set(SECTION_PATHS)) == 15 == 2 ** (MAX_DEPTH + 1) - 1
    sequences = set()
    for path in SECTION_PATHS:
        assert path.startswith('strict $[*] ? (@.type() == "object").keyvalue() ? (')
        assert path.endswith(' ? (@.type() == "string")')
        # the containers below the section key, after the section's own object filter
        sequences.add(tuple(re.findall(r'\(@\.type\(\) == "(array|object)"\)', path)[1:]))
    assert sequences == {sequence for depth in range(MAX_DEPTH + 1)
                         for sequence in itertools.product(("array", "object"), repeat=depth)}


def test_level_and_location_are_denied_only_at_the_section_step():
    """A section's level and location are its badges; inside a structured field (a
    fish's location) they are content."""
    assert len(SECTION_DENY) == 9 and len(NESTED_DENY) == 7
    assert set(SECTION_DENY) - set(NESTED_DENY) == {"level", "location"}
    for path in SECTION_PATHS:
        section, *nested = re.findall(r"\.keyvalue\(\) \? \(([^)]*)\)", path)
        assert set(_DENIED.findall(section)) == set(SECTION_DENY)
        assert len(nested) == path.count('? (@.type() == "object").keyvalue()') - 1
        for step in nested:
            assert set(_DENIED.findall(step)) == set(NESTED_DENY)
        for step in [section, *nested]:
            # Nothing but key tests joined by &&: a single || would let every key through.
            assert step == " && ".join(f'@.key != "{key}"' for key in _DENIED.findall(step))


# One jsonb_path_query_array call: the column behind its jsonb_typeof guard, then the path.
_GUARDED_CALL = re.compile(
    r"jsonb_path_query_array\(CASE WHEN jsonb_typeof\((\w+)\) = '(array|object)' "
    r"THEN \1 ELSE '(\[\]|\{\})'::jsonb END, '(strict [^']*)'\)")


@pytest.mark.parametrize("table, columns", [
    ("collectibles", {"description"}),
    ("walkthroughs", {"content", "objectives", "rewards"}),
])
def test_every_strict_path_runs_behind_its_type_guards(table, columns):
    """Strict jsonpath raises on a value of the wrong type, and a raise would fail the
    seeder's write. So each column is turned into the type its path starts from, and
    inside the path every [*] and .keyvalue() follows a filter for that type."""
    expr = SEARCH_COLUMNS[table]
    calls = _GUARDED_CALL.findall(expr)
    assert len(calls) == expr.count("jsonb_path_query_array(") == expr.count("'strict ")
    assert {column for column, *_ in calls} == columns
    for _column, kind, empty, path in calls:
        assert empty == ("[]" if kind == "array" else "{}")
        steps = path.removeprefix("strict $")
        assert steps.startswith("[*]" if kind == "array" else ".keyvalue()"), path
        for step in re.finditer(r"\[\*\]|\.keyvalue\(\)", steps):
            if step.start() > 0:
                needed = "array" if step.group() == "[*]" else "object"
                assert steps[:step.start()].endswith(f'? (@.type() == "{needed}")'), path
        assert path.endswith('? (@.type() == "string")'), path


def test_the_walkthrough_column_reads_content_through_every_section_path():
    content = {path for column, _, _, path in _GUARDED_CALL.findall(WALKTHROUGH_VECTOR) if column == "content"}
    assert content == set(SECTION_PATHS)


# Forms Postgres refuses in a generated column: volatile or stable functions, and
# subqueries. A stored column has to be computable from its own row alone.
_NOT_IMMUTABLE = ("now(", "random(", "current_", "nextval", "jsonb_build_", "to_jsonb",
                  "clock_timestamp", "timeofday", "_tz(")


@pytest.mark.parametrize("table", list(SEARCH_COLUMNS))
def test_the_expressions_use_only_immutable_forms(table):
    expr = SEARCH_COLUMNS[table].lower()
    for form in _NOT_IMMUTABLE:
        assert form not in expr, form
    assert not re.search(r"\bselect\b", expr)
    # Without a configuration, to_tsvector reads default_text_search_config: stable.
    assert expr.count("to_tsvector(") == expr.count("to_tsvector('english', ") + expr.count("to_tsvector('simple', ")


# ---------------------------------------------------------------------------
# The DDL: plan_search_columns, and seed_db.py running it
# ---------------------------------------------------------------------------

def _state(present=True, generated=True, tag=None):
    return {"present": present, "stored_generated": generated, "tag": tag}


ABSENT = {table: _state(present=False, generated=False) for table in SEARCH_COLUMNS}
CURRENT = {table: _state(tag=column_tag(expr)) for table, expr in SEARCH_COLUMNS.items()}
STALE = {table: _state(tag="search_text 000000000000") for table in SEARCH_COLUMNS}


def _add(table):
    return (f"ALTER TABLE {table} ADD COLUMN search_vector tsvector "
            f"GENERATED ALWAYS AS ({SEARCH_COLUMNS[table]}) STORED")


def _comment(table):
    return f"COMMENT ON COLUMN {table}.search_vector IS '{column_tag(SEARCH_COLUMNS[table])}'"


def test_absent_columns_are_added_and_tagged():
    assert plan_search_columns(ABSENT, 160013) == [
        _add("collectibles"), _comment("collectibles"), _add("walkthroughs"), _comment("walkthroughs"),
    ]


@pytest.mark.parametrize("version", [160013, 170000])
def test_current_columns_are_left_alone(version):
    assert plan_search_columns(CURRENT, version) == []


@pytest.mark.parametrize("version", [160013, 169999])
def test_stale_columns_are_dropped_and_added_before_postgres_17(version):
    expected = []
    for table in SEARCH_COLUMNS:
        expected += [f"ALTER TABLE {table} DROP COLUMN search_vector", _add(table), _comment(table)]
    assert plan_search_columns(STALE, version) == expected


def test_stale_columns_get_their_new_expression_in_place_from_postgres_17():
    expected = []
    for table, expr in SEARCH_COLUMNS.items():
        expected += [f"ALTER TABLE {table} ALTER COLUMN search_vector SET EXPRESSION AS ({expr})",
                     _comment(table)]
    assert plan_search_columns(STALE, 170000) == expected


def test_an_untagged_column_counts_as_stale():
    states = {**CURRENT, "walkthroughs": _state(tag=None)}
    assert plan_search_columns(states, 170000) == [
        f"ALTER TABLE walkthroughs ALTER COLUMN search_vector SET EXPRESSION AS ({WALKTHROUGH_VECTOR})",
        _comment("walkthroughs"),
    ]


def test_a_search_vector_that_is_not_a_stored_generated_column_is_never_replaced():
    # Nothing comes back for the other table either: no half-applied plan.
    states = {"collectibles": _state(present=False, generated=False), "walkthroughs": _state(generated=False)}
    with pytest.raises(RuntimeError, match="not a stored generated column"):
        plan_search_columns(states, 170000)


def test_the_tag_names_the_expression_it_was_built_from():
    for expr in SEARCH_COLUMNS.values():
        tag = column_tag(expr)
        assert tag == "search_text " + hashlib.sha256(expr.encode()).hexdigest()[:12]
        assert re.fullmatch(r"search_text [0-9a-f]{12}", tag)    # safe inside COMMENT's quotes
    assert column_tag(COLLECTIBLE_VECTOR) != column_tag(WALKTHROUGH_VECTOR)
    # Any edit to an expression makes its column stale.
    assert column_tag(COLLECTIBLE_VECTOR + " ") != column_tag(COLLECTIBLE_VECTOR)


class _Conn:
    """Answers seed_db's two reads (the server version and COLUMN_STATE_SQL) and
    records every statement it is sent."""

    def __init__(self, states, version):
        self.states, self.version, self.sql = states, version, []

    async def exec_driver_sql(self, statement):
        self.sql.append(statement)
        result = MagicMock()
        result.scalar.return_value = str(self.version)
        return result

    async def execute(self, clause):
        assert clause.text == COLUMN_STATE_SQL
        result = MagicMock()
        result.all.return_value = [SimpleNamespace(table_name=table, _mapping={"table_name": table, **state})
                                   for table, state in self.states.items()]
        return result


@pytest.mark.parametrize("states, version", [(ABSENT, 160013), (STALE, 170000), (CURRENT, 170000)],
                         ids=["absent", "stale", "current"])
async def test_seed_db_builds_the_columns_through_plan_search_columns(monkeypatch, states, version):
    planned = []

    def plan(read_states, read_version):
        planned.append((read_states, read_version))
        return plan_search_columns(read_states, read_version)

    monkeypatch.setattr(seed_db, "plan_search_columns", plan)
    conn = _Conn(states, version)

    await seed_db.ensure_search_columns(conn)

    assert planned == [({table: {"table_name": table, **state} for table, state in states.items()}, version)]
    reads = conn.sql.index("SHOW server_version_num")
    assert conn.sql[:reads] == ["CREATE EXTENSION IF NOT EXISTS pg_trgm",
                                f"DROP INDEX IF EXISTS {', '.join(RETIRED_SEARCH_INDEXES)}"]
    assert conn.sql[reads + 1:] == plan_search_columns(states, version)


def _function(tree, name):
    return next(node for node in ast.walk(tree)
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == name)


def _call_lines(node, name):
    """The line of every call to `name`, plain or as an attribute, under `node`."""
    return sorted(call.lineno for call in ast.walk(node) if isinstance(call, ast.Call)
                  and name in (getattr(call.func, "id", None), getattr(call.func, "attr", None)))


def test_seed_database_writes_no_search_ddl_of_its_own():
    """Its search columns come from plan_search_columns alone, and the old statements'
    indexes are only ever dropped, by RETIRED_SEARCH_INDEXES."""
    tree = ast.parse((SCRIPTS / "db" / "seed_db.py").read_text(encoding="utf-8"))
    assert _call_lines(_function(tree, "seed_database"), "ensure_search_columns")
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            assert "search_vector" not in node.value and "GENERATED ALWAYS" not in node.value, node.value
            assert not any(index in node.value for index in RETIRED_SEARCH_INDEXES), node.value


# ---------------------------------------------------------------------------
# The Python twin: the strings the index reads
# ---------------------------------------------------------------------------

FISHING = {
    "order": 4, "type": "fishing", "id": "fishing-4", "slug": "fishing",
    "section_title": "Fishing Spots",
    "level": "Great Desert", "location": "Oasis",               # the section's badges
    "text": "Cast from the pier at dusk.",
    "fish": [
        {"name": "Golden Trout", "location": "Pier", "level": "Rare", "bait": "Mystery Bait", "id": "f1",
         "images": [{"url": "trout.webp", "alt": "A trout on the line", "caption": "Caught at dusk"}]},
    ],
    "images": [{"url": "pier.webp", "alt": "The pier", "caption": "Sunset"}],
}


def test_a_fishs_location_is_content_while_the_sections_own_is_a_badge():
    assert sorted(section_strings(FISHING)) == sorted(
        ["Fishing Spots", "Cast from the pier at dusk.", "Golden Trout", "Pier", "Rare", "Mystery Bait"])


HIDDEN = {"images": [{"url": "hidden.webp", "alt": "hidden alt", "caption": "hidden caption"}],
          "url": "hidden url", "alt": "hidden alt text", "id": "hidden id"}


@pytest.mark.parametrize("block", [
    {"text": "seen", **HIDDEN},                                 # the section's own keys
    {"fish": {"name": "seen", **HIDDEN}},                       # an object below a section key
    {"fish": [{"name": "seen", **HIDDEN}]},                     # objects in a list
    {"fish": [{"spots": {"name": "seen", **HIDDEN}}]},          # the deepest strings read
], ids=["section", "object", "list", "deepest"])
def test_image_keys_are_dropped_with_everything_beneath_them(block):
    strings = section_strings(block)
    assert "seen" in strings
    assert [s for s in strings if "hidden" in s] == []


def _in_lists(value, depth):
    for _ in range(depth):
        value = [value]
    return value


def test_nothing_past_max_depth_is_read():
    block = {f"key{depth}": _in_lists(f"depth {depth}", depth) for depth in range(MAX_DEPTH + 3)}
    assert section_strings(block) == [f"depth {depth}" for depth in range(MAX_DEPTH + 1)]
    # Objects count as containers too: "read" sits three below the key, "past" four.
    objects = {"a": {"b": {"c": {"d": {"e": "past"}, "f": "read"}}}}
    assert section_strings(objects) == ["read"]


def test_malformed_shapes_give_no_strings():
    """The twin mirrors the SQL's type guards: anything that is not the expected
    container, and any leaf that is not a string, gives nothing."""
    assert section_strings("text") == section_strings(["text"]) == section_strings(None) == []
    assert search_text.walkthrough_strings({"text": "a"}, "objective", {"reward": "x"}) == []
    assert search_text.walkthrough_strings([{"text": 1, "tip": None, "warning": True, "list": [2.5, {}]}]) == []
    assert search_text.description_strings(["content"]) == []
    assert search_text.description_strings({"content": 5, "items": "not a list"}) == []
    assert search_text.description_strings({"content": "Text.", "items": ["One.", 2, None, "Two."]}) == [
        "Text.", "One.", "Two."]


# ---------------------------------------------------------------------------
# The depth guard
# ---------------------------------------------------------------------------

def test_too_deep_is_empty_within_max_depth():
    content = [{"order": 1, "text": "a", "fish": [{"spots": {"night": "Pier"}}], "rows": [[["x"]]]}]
    assert too_deep(content) == []


def test_too_deep_names_the_path_of_a_string_one_level_deeper():
    content = [{"order": 1, "text": "a"},
               {"order": 2, "fish": [{"name": "Trout", "spots": {"night": ["Pier", "Dock"]}}]}]
    assert too_deep(content) == ["content[1].fish[0].spots.night[0]", "content[1].fish[0].spots.night[1]"]


def test_strings_under_denied_keys_never_count():
    deep = _in_lists("x", MAX_DEPTH + 2)
    content = [{**{key: deep for key in SECTION_DENY}, "fish": [{key: deep for key in NESTED_DENY}]}]
    assert too_deep(content) == []


def test_a_nested_location_counts_but_the_sections_own_does_not():
    content = [{"location": {"a": {"b": {"c": ["x"]}}},
                "fish": [{"location": {"a": {"b": ["x"]}}}]}]
    assert too_deep(content) == ["content[0].fish[0].location.a.b[0]"]


def test_too_deep_skips_malformed_content():
    assert too_deep(None) == too_deep("text") == too_deep([1, "text", None, ["x"]]) == []


_KEYS = list(SECTION_DENY) + ["text", "tip", "fish", "spots", "name", "night", "rows", "notes"]


def _random_value(rng, depth):
    roll = rng.random()
    if depth >= 6 or roll < 0.35:
        return rng.choice([f"s{rng.randrange(1000)}", 7, None, True, 2.5])
    if roll < 0.7:
        return [_random_value(rng, depth + 1) for _ in range(rng.randint(0, 3))]
    return {rng.choice(_KEYS): _random_value(rng, depth + 1) for _ in range(rng.randint(0, 3))}


def _readable(block):
    """Every string under keys the index reads, at any depth: the section's keys less
    SECTION_DENY, and below them every key less NESTED_DENY."""
    found = []

    def walk(value):
        if isinstance(value, str):
            found.append(value)
        elif isinstance(value, list):
            for item in value:
                walk(item)
        elif isinstance(value, dict):
            for key, item in value.items():
                if key not in NESTED_DENY:
                    walk(item)

    for key, value in block.items():
        if key not in SECTION_DENY:
            walk(value)
    return found


def test_every_readable_string_is_indexed_or_reported():
    """The index and the depth guard draw the line in the same place: a string under
    keys the index reads is indexed or named by too_deep, never both, never neither."""
    rng = random.Random(3616)
    indexed = reported = 0
    for _ in range(500):
        block = {rng.choice(_KEYS): _random_value(rng, 0) for _ in range(rng.randint(1, 4))}
        strings, paths = section_strings(block), too_deep([block])
        assert len(strings) + len(paths) == len(_readable(block)), block
        assert not Counter(strings) - Counter(_readable(block)), block
        indexed, reported = indexed + len(strings), reported + len(paths)
    assert indexed and reported      # the corpus reaches both sides of the line


# ---------------------------------------------------------------------------
# Links
# ---------------------------------------------------------------------------

# _strip_links before the rework, verbatim: snippets and the index must keep reading a
# wikilink exactly as the site always has.
ORIGINAL_LINK = re.compile(r"\[\[[^\]|]+\|([^\]]+)\]\]")


def _link_corpus():
    symbols = ["[", "]", "|", "a", '"', "\\"]
    every_short = ["".join(p) for n in range(7) for p in itertools.product(symbols, repeat=n)]
    pieces = ["[[", "]]", "[", "]", "|", "[[a|b]]", "[[path|label]]", "[[x|", "|y]]", '"', "\\", '\\"',
              " ", "word", chr(0xE9), chr(0x3B2)]
    rng = random.Random(3616)
    generated = ["".join(rng.choice(pieces) for _ in range(rng.randint(1, 12))) for _ in range(3000)]
    return every_short + generated


def test_strip_links_reads_wikilinks_as_the_original_pattern_did():
    for text in _link_corpus():
        assert search_text.strip_links(text) == ORIGINAL_LINK.sub(r"\1", text), text


# ---------------------------------------------------------------------------
# Text blocks: the rule the site lays text out by
# ---------------------------------------------------------------------------

EN, EM, LS = chr(0x2013), chr(0x2014), chr(0x2028)   # kept out of the source as literals


def _p(text):
    return ("paragraph", text)


def _list(*items):
    return ("list", list(items))


# The same cases, in the same order, as client/src/utils/textBlocks.test.ts (the blocks)
# and descriptionText.test.ts (the plain text).
TEXT_CASES = [
    ("no newline", "Buy them.", [_p("Buy them.")], "Buy them."),
    ("empty", "", [_p("")], ""),
    ("blank lines only", "\n\n", [_p(""), _p("")], "\n\n"),
    ("two paragraphs", "First.\n\nSecond.", [_p("First."), _p("Second.")], "First.\n\nSecond."),
    ("an intro and a list", "Bosses:\n\n- a\n- b", [_p("Bosses:"), _list("a", "b")], "Bosses: a, b"),
    ("only a list", "- a\n- b", [_list("a", "b")], "a, b"),
    ("a list, then text", "Intro:\n\n- a\n- b\n\nThen.", [_p("Intro:"), _list("a", "b"), _p("Then.")],
     "Intro: a, b Then."),
    ('a single "- " line', "Intro\n\n- a", [_p("Intro"), _p("- a")], "Intro\n\n- a"),
    ("a hyphen mid-line", "left - right\nup - down", [_p("left - right\nup - down")], "left - right\nup - down"),
    ('"-" with no space', "-a\n-b", [_p("-a\n-b")], "-a\n-b"),
    ("a list after a single newline", "Intro:\n- a\n- b", [_p("Intro:\n- a\n- b")], "Intro:\n- a\n- b"),
    ("a newline after the last item", "- a\n- b\n", [_p("- a\n- b\n")], "- a\n- b\n"),
    ("a blank line holding a space", "Intro\n \n- a\n- b", [_p("Intro\n \n- a\n- b")], "Intro\n \n- a\n- b"),
    ("en and em dash lines", f"{EN} a\n{EM} b", [_p(f"{EN} a\n{EM} b")], f"{EN} a\n{EM} b"),
    ("a nested list", "- a\n  - b", [_p("- a\n  - b")], "- a\n  - b"),
    ("three newlines before a list", "Intro\n\n\n- a\n- b", [_p("Intro"), _p("\n- a\n- b")], "Intro\n\n\n- a\n- b"),
    ("trailing spaces", "- a  \n- b ", [_list("a  ", "b ")], "a  , b "),
    ("an empty item", "- \n- b", [_list("", "b")], ", b"),
    ("a carriage return", "- a\r\n- b", [_list("a\r", "b")], "a\r, b"),
    ("a Unicode line separator", f"- a{LS}- b", [_p(f"- a{LS}- b")], f"- a{LS}- b"),
    ("a link in an item", "- [[levels/xion|Xion]]\n- b", [_list("[[levels/xion|Xion]]", "b")],
     "[[levels/xion|Xion]], b"),
    ("a paragraph with its own newline beside a list", "One\ntwo\n\n- a\n- b", [_p("One\ntwo"), _list("a", "b")],
     "One two a, b"),
]

# Weapon Core [856], the entry the rule was shared for.
WEAPON_CORE_INTRO = ("Available to purchase from D1G-g2r. Costs 2 Damaged Weapon Cores each, with 2 in stock. "
                     "Damaged Weapon Cores are dropped by certain side quest and overworld bosses:")
WEAPON_CORE_ITEMS = [
    "Corrupter in Wasteland Basin",
    "Gigas at Oil Storage Facility ([[walkthroughs/side-quests/urgent-information|Urgent Information]])",
    "Brute in Forbidden Area ([[walkthroughs/side-quests/life-of-the-scavengers|Life of the Scavengers]])",
    "Stalker at Solar Tower in the Great Desert ([[walkthroughs/side-quests/reboot-great-desert|Reboot!!!]])",
    "Abaddon in Buried Ruins ([[walkthroughs/side-quests/an-eye-for-an-eye-a-tooth-for-a-tooth"
    "|An Eye for an Eye, a Tooth for a Tooth]])",
    "Behemoth in Northern Great Desert ([[walkthroughs/side-quests/encounter|Encounter]])",
]
WEAPON_CORE = WEAPON_CORE_INTRO + "\n\n" + "\n".join(f"- {item}" for item in WEAPON_CORE_ITEMS)


@pytest.mark.parametrize("name, text, blocks, plain", TEXT_CASES, ids=[case[0] for case in TEXT_CASES])
def test_text_blocks_sort_text_as_the_client_does(name, text, blocks, plain):
    assert search_text.text_blocks(text) == blocks


@pytest.mark.parametrize("name, text, blocks, plain", TEXT_CASES, ids=[case[0] for case in TEXT_CASES])
def test_plain_text_reads_a_list_as_one_line_as_the_client_does(name, text, blocks, plain):
    assert search_text.plain_text(text) == plain


def test_weapon_cores_bosses_are_an_intro_and_six_items():
    assert search_text.text_blocks(WEAPON_CORE) == [_p(WEAPON_CORE_INTRO), _list(*WEAPON_CORE_ITEMS)]
    assert search_text.plain_text(WEAPON_CORE) == WEAPON_CORE_INTRO + " " + ", ".join(WEAPON_CORE_ITEMS)


@pytest.mark.parametrize("value", [None, 5, ["- a", "- b"], {"content": "- a\n- b"}])
def test_plain_text_leaves_anything_but_a_string_as_it_is(value):
    assert search_text.plain_text(value) == value
