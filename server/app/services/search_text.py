"""The one place search decides which text a page is found by.

Postgres builds the stored `search_vector` columns on collectibles and walkthroughs
from the expressions here, and the snippet code reads the same strings back through
the Python twin below, so the two must agree string for string.
scripts/search_eval.py checks that on every real row and on a generated corpus of
nested shapes.

Each column carries a tag (column_tag) naming the expression it was built from.
seed_db.py and the migration compare tags and rebuild a column whose tag is stale,
so changing anything that feeds an expression here needs that migration run. A rework
of the walkthrough section blocks has to re-check SECTION_DENY, NESTED_DENY,
MAX_DEPTH and section_text against the new block shape.

This module imports nothing from the app, so seeders and scripts can use it without
an engine or a cache client.
"""
import hashlib
import itertools
import re

# Keys whose text is never search text, at any depth: image data and block structure.
NESTED_DENY = ("images", "url", "alt", "id", "slug", "order", "type")
# A section's own `level` and `location` are its badges, and indexing them would make
# every walkthrough in a level match that level's name. Inside a structured field they
# are content (a fish's location), so only the section level denies them.
SECTION_DENY = NESTED_DENY + ("level", "location")
# Containers (arrays or objects) below a section key that the index reads through.
# Current content nests at most two deep. A string any deeper is never indexed, so
# seed_walkthroughs.py refuses such a file (too_deep) instead of losing its text.
MAX_DEPTH = 3

# The base cycle's stored spellings: today's `Base`, and `NG` once the planned rename
# lands. Both stay out of the index, since `NG` parses to the same lexeme as `NG+`
# and would put every first-playthrough item under "ng+" and "new game plus".
BASE_CYCLES = ("Base", "NG")

# [[path|label]] -> label. The text pattern is _strip_links' own; the JSON one does
# the same on a jsonb array's text form, where a match must not cross the boundary
# between two strings, so a stray "[[" never swallows the next one.
LINK_RX = re.compile(r"\[\[[^\]|]+\|([^\]]+)\]\]")
WIKILINK_TEXT = r"""'\[\[[^]|]+\|([^]]+)\]\]', '\1', 'g'"""
WIKILINK_JSON = r"""'\[\[((?:[^]|"\\]|\\.)+)\|((?:[^]"\\]|\\.)+)\]\]', '\2', 'g'"""


def strip_links(text: str) -> str:
    return LINK_RX.sub(r"\1", text)


# ---------------------------------------------------------------------------
# SQL: the stored column expressions
#
# Every jsonpath is strict and runs behind a type guard, so no JSON shape can make a
# seeder's write fail, and the Python twin can mirror it exactly.
# ---------------------------------------------------------------------------

def _keep(deny: tuple[str, ...]) -> str:
    return " && ".join(f'@.key != "{key}"' for key in deny)


_SECTION_STEP = f'strict $[*] ? (@.type() == "object").keyvalue() ? ({_keep(SECTION_DENY)}).value'
_ARRAY_STEP = ' ? (@.type() == "array")[*]'
_OBJECT_STEP = f' ? (@.type() == "object").keyvalue() ? ({_keep(NESTED_DENY)}).value'
_STRING_STEP = ' ? (@.type() == "string")'

# One path per sequence of arrays and objects, down to MAX_DEPTH containers below a
# section key. Each object step applies the deny list again, so a denied key cuts off
# everything beneath it however deep it sits (15 paths at depth 3).
SECTION_PATHS = tuple(
    _SECTION_STEP + "".join(steps) + _STRING_STEP
    for depth in range(MAX_DEPTH + 1)
    for steps in itertools.product((_ARRAY_STEP, _OBJECT_STEP), repeat=depth)
)
_LIST_PATH = 'strict $[*] ? (@.type() == "string")'
_DESCRIPTION_PATHS = (
    'strict $.keyvalue() ? (@.key == "content").value ? (@.type() == "string")',
    'strict $.keyvalue() ? (@.key == "items").value ? (@.type() == "array")[*] ? (@.type() == "string")',
)


def _array(column: str) -> str:
    return f"CASE WHEN jsonb_typeof({column}) = 'array' THEN {column} ELSE '[]'::jsonb END"


def _object(column: str) -> str:
    return f"CASE WHEN jsonb_typeof({column}) = 'object' THEN {column} ELSE '{{}}'::jsonb END"


def _strings(arrays: list[str]) -> str:
    """One jsonb array holding every string in `arrays`, wikilinks reduced to labels."""
    return "regexp_replace((" + " || ".join(arrays) + f")::text, {WIKILINK_JSON})::jsonb"


def both_configs(expr: str, weight: str) -> str:
    """Stemmed and as typed: the second copy lets "fishin" find "fishing"."""
    return (f"setweight(to_tsvector('english', {expr}), '{weight}') || "
            f"setweight(to_tsvector('simple', {expr}), '{weight}')")


_WALKTHROUGH_TEXT = _strings(
    [f"jsonb_path_query_array({_array('content')}, '{path}')" for path in SECTION_PATHS]
    + [f"jsonb_path_query_array({_array('objectives')}, '{_LIST_PATH}')",
       f"jsonb_path_query_array({_array('rewards')}, '{_LIST_PATH}')"]
)
_DESCRIPTION_TEXT = _strings(
    [f"jsonb_path_query_array({_object('description')}, '{path}')" for path in _DESCRIPTION_PATHS]
)
_CYCLE = ("CASE WHEN cycle NOT IN (" + ", ".join(f"'{c}'" for c in BASE_CYCLES)
          + ") THEN cycle ELSE '' END")

# Title A, subtitle B, everything else D. Unqualified column names, so an expression
# also evaluates as-is in a single-table SELECT (the migration and search_eval do that).
WALKTHROUGH_VECTOR = " || ".join([
    both_configs("title", "A"),
    both_configs("coalesce(subtitle, '')", "B"),
    both_configs(f"regexp_replace(coalesce(available_after, ''), {WIKILINK_TEXT})", "D"),
    both_configs(_WALKTHROUGH_TEXT, "D"),
])
# Title A, description D, a cycle other than the base one C.
COLLECTIBLE_VECTOR = " || ".join([
    both_configs("title", "A"),
    both_configs(_DESCRIPTION_TEXT, "D"),
    f"setweight(to_tsvector('simple', {_CYCLE}), 'C')",
])

SEARCH_COLUMNS = {"collectibles": COLLECTIBLE_VECTOR, "walkthroughs": WALKTHROUGH_VECTOR}

# The indexes the old search statements were built around. Nothing can use them now:
# similarity() never uses a trigram index, and no query matches the FTS expressions.
# seed_db.py drops them where it finds them; the migration drops them and its revert
# recreates them from its own verbatim copies.
RETIRED_SEARCH_INDEXES = (
    "ix_collectibles_fts", "ix_walkthroughs_fts", "ix_levels_fts",
    "ix_collectibles_trgm", "ix_walkthroughs_trgm", "ix_levels_trgm",
)


def column_tag(expr: str) -> str:
    """The comment a column carries to name its expression. pg_get_expr never
    byte-matches the source text, so the tag is how a stale column is spotted."""
    return "search_text " + hashlib.sha256(expr.encode()).hexdigest()[:12]


COLUMN_STATE_SQL = """
SELECT t.name AS table_name,
       a.attnum IS NOT NULL AS present,
       coalesce(a.attgenerated = 's', false) AS stored_generated,
       col_description(t.oid, a.attnum) AS tag,
       pg_get_expr(d.adbin, d.adrelid) AS expression
FROM (VALUES ('collectibles', 'collectibles'::regclass),
             ('walkthroughs', 'walkthroughs'::regclass)) AS t(name, oid)
LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attname = 'search_vector' AND NOT a.attisdropped
LEFT JOIN pg_attrdef d ON d.adrelid = t.oid AND d.adnum = a.attnum
"""


def plan_search_columns(states: dict, server_version_num: int) -> list[str]:
    """The DDL that brings both search_vector columns to their current expressions.

    `states` maps each table to its COLUMN_STATE_SQL row (present, stored_generated,
    tag). An absent column is added, a current one left alone, and a stale one
    rebuilt: SET EXPRESSION on PostgreSQL 17+, DROP and ADD before that. A
    search_vector column that is not a stored generated one is not ours to replace.
    """
    statements = []
    for table, expr in SEARCH_COLUMNS.items():
        state, tag = states[table], column_tag(expr)
        add = f"ALTER TABLE {table} ADD COLUMN search_vector tsvector GENERATED ALWAYS AS ({expr}) STORED"
        comment = f"COMMENT ON COLUMN {table}.search_vector IS '{tag}'"
        if not state["present"]:
            statements += [add, comment]
        elif not state["stored_generated"]:
            raise RuntimeError(f"{table}.search_vector exists but is not a stored generated column; "
                               "refusing to replace it")
        elif state["tag"] != tag:
            if server_version_num >= 170000:
                statements += [f"ALTER TABLE {table} ALTER COLUMN search_vector SET EXPRESSION AS ({expr})",
                               comment]
            else:
                statements += [f"ALTER TABLE {table} DROP COLUMN search_vector", add, comment]
    return statements


# ---------------------------------------------------------------------------
# Python twin: the same strings, for snippets and for checking the SQL
# ---------------------------------------------------------------------------

def section_strings(block) -> list[str]:
    """Every string the index reads from one section, mirroring SECTION_PATHS."""
    found = []

    def walk(value, depth):
        if isinstance(value, str):
            found.append(value)
        elif depth < MAX_DEPTH and isinstance(value, list):
            for item in value:
                walk(item, depth + 1)
        elif depth < MAX_DEPTH and isinstance(value, dict):
            for key, item in value.items():
                if key not in NESTED_DENY:
                    walk(item, depth + 1)

    if isinstance(block, dict):
        for key, value in block.items():
            if key not in SECTION_DENY:
                walk(value, 0)
    return found


_LEAD_KEYS = ("text", "tip", "warning")


def section_text(block) -> str:
    """A section's searchable text in reading order, links reduced to labels: its text,
    tip and warning, then any other fields. Its title labels the snippet instead."""
    if not isinstance(block, dict):
        return ""
    lead = [block[key] for key in _LEAD_KEYS if isinstance(block.get(key), str)]
    rest = section_strings({k: v for k, v in block.items() if k not in _LEAD_KEYS + ("section_title",)})
    return " ".join(strip_links(s) for s in lead + rest)


def list_strings(value) -> list[str]:
    """The strings of an objectives or rewards array, mirroring _LIST_PATH."""
    return [item for item in value if isinstance(item, str)] if isinstance(value, list) else []


def description_strings(description) -> list[str]:
    """A collectible description's strings, mirroring _DESCRIPTION_PATHS."""
    if not isinstance(description, dict):
        return []
    content = description.get("content")
    return ([content] if isinstance(content, str) else []) + list_strings(description.get("items"))


def walkthrough_strings(content, objectives=None, rewards=None) -> list[str]:
    """Every body string of a walkthrough, as indexed (before link stripping)."""
    blocks = content if isinstance(content, list) else []
    return ([s for block in blocks for s in section_strings(block)]
            + list_strings(objectives) + list_strings(rewards))


def text_blocks(text: str) -> list[tuple[str, str | list[str]]]:
    """client/src/utils/textBlocks.ts in Python, the rule the site renders text by: blank
    lines separate blocks, and a block of two or more lines that all start with "- " is a
    list, its items without the "- ". Anything else is a paragraph, newlines and all.
    str.split on purpose: splitlines would also break at a carriage return or a Unicode
    line separator, where the client doesn't. tests/test_search_text.py and the client's
    tests pin the same cases."""
    blocks = []
    for block in text.split("\n\n"):
        lines = block.split("\n")
        if len(lines) > 1 and all(line.startswith("- ") for line in lines):
            blocks.append(("list", [line[2:] for line in lines]))
        else:
            blocks.append(("paragraph", block))
    return blocks


def plain_text(text):
    """Description content on one line, as plainText in client/src/utils/descriptionText.ts
    gives it: unchanged unless it holds a list; otherwise its blocks joined by a space (a
    paragraph's own newlines too) and each list's items by ", ". Anything not a string
    comes back as it is."""
    if not isinstance(text, str):
        return text
    blocks = text_blocks(text)
    if not any(kind == "list" for kind, _ in blocks):
        return text
    return " ".join(", ".join(value) if kind == "list" else value.replace("\n", " ")
                    for kind, value in blocks)


def too_deep(content) -> list[str]:
    """Key paths of strings that sit deeper than MAX_DEPTH under keys the index reads,
    such as "content[3].fish[0].spots.night[1]". The index would skip them silently."""
    paths = []

    def walk(value, depth, path):
        if isinstance(value, str):
            if depth > MAX_DEPTH:
                paths.append(path)
        elif isinstance(value, list):
            for i, item in enumerate(value):
                walk(item, depth + 1, f"{path}[{i}]")
        elif isinstance(value, dict):
            for key, item in value.items():
                if key not in NESTED_DENY:
                    walk(item, depth + 1, f"{path}.{key}")

    if isinstance(content, list):
        for i, block in enumerate(content):
            if isinstance(block, dict):
                for key, value in block.items():
                    if key not in SECTION_DENY:
                        walk(value, 0, f"content[{i}].{key}")
    return paths
