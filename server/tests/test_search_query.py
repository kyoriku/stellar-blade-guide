"""
The query side of search (app/services/search.py): the text normalize_search_query
keeps, the tsquery parts build_query hands the statement, and the typo fallback's
distance, edit limits and correction. Last, what can be checked of the statement
without Postgres: the parameters it binds, and that each costly measure is computed once.

build_query is the only place typed text becomes tsquery text. Every word goes in as a
quoted run of letters and digits and the aliases are fixed constants, so nothing typed
can become tsquery syntax; the hostile corpus below pins that on the strings
themselves. scripts/search_eval.py runs a corpus like it through the real statement on
Postgres.

Pure functions, plus a fake session that answers _correct's vocabulary query: no app,
no database and no Redis here.
"""
import itertools
import random
import re
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.services import search, search_text
from app.services.search import (
    APPEARANCE, EVE_OUTFIT, NG, NG_PHRASE, OUTFIT, build_query, normalize_search_query,
)

# Characters kept out of the source as literals.
NBSP = chr(0xA0)
SOFT_HYPHEN = chr(0xAD)
CURLY_APOSTROPHE = chr(0x2019)
ZERO_WIDTH_SPACE = chr(0x200B)
IDEOGRAPHIC_SPACE = chr(0x3000)
FFI_LIGATURE = chr(0xFB03)       # one character, three letters after NFKC


def fullwidth(text):
    """ASCII letters as their full-width forms (NFKC folds them back)."""
    return "".join(chr(ord(c) - 0x61 + 0xFF41) if "a" <= c <= "z" else c for c in text)


def parse(raw):
    """What the statement gets for a query as typed: normalized, then built."""
    return build_query(normalize_search_query(raw))


# ---------------------------------------------------------------------------
# normalize_search_query: the text search runs, caches and logs
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("raw, expected", [
    ("NaNo SUIT", "nano suit"),
    ("  nano   suit  ", "nano suit"),
    (fullwidth("nano") + " suit", "nano suit"),
    (fullwidth("nano").upper(), "nano"),               # full-width capitals: NFKC, then lowercase
    ("nano" + NBSP + "suit", "nano suit"),
    ("nano" + IDEOGRAPHIC_SPACE + "suit", "nano suit"),
    ("na" + ZERO_WIDTH_SPACE + "no", "nano"),
    ("na" + SOFT_HYPHEN + "no", "nano"),
    (ZERO_WIDTH_SPACE + SOFT_HYPHEN, ""),
])
def test_normalization(raw, expected):
    assert normalize_search_query(raw) == expected


def test_normalized_query_is_capped_at_100_characters():
    assert normalize_search_query("a" * 150) == "a" * 100
    # The cap comes last: NFKC can lengthen the text, and dropped or collapsed
    # characters never count against it.
    assert normalize_search_query(FFI_LIGATURE * 100) == ("ffi" * 100)[:100]
    assert normalize_search_query(ZERO_WIDTH_SPACE * 50 + "b" * 100) == "b" * 100
    assert normalize_search_query(" " * 50 + "c" * 100) == "c" * 100
    # A cut that lands on a space leaves none behind: one query, one cache key.
    assert normalize_search_query("a" * 99 + " b") == "a" * 99
    assert normalize_search_query(FFI_LIGATURE * 33 + " b") == "ffi" * 33


# ---------------------------------------------------------------------------
# New Game Plus
# ---------------------------------------------------------------------------

NG_SPELLINGS = [
    "new game plus", "new game +", "ng+", "ng++", "ng +", "ng plus", "newgame+",
    # still being typed: the query ends in part of "plus"
    "new game p", "new game pl", "new game plu",
]


@pytest.mark.parametrize("raw", NG_SPELLINGS)
def test_every_new_game_plus_spelling_is_the_ng_alias(raw):
    parsed = parse(raw)
    assert parsed["all_q"] == parsed["any_q"] == NG
    assert parsed["phrase_q"] == NG_PHRASE
    assert parsed["lit_q"] == ""          # the words typed were the alias: nothing literal is left
    assert parsed["last"] == "" and parsed["plain"] == []
    assert parsed["concept_words"] == {"new game", "ng"}


def test_new_game_plus_is_matched_whatever_the_case():
    assert parse("NG+") == parse("ng+")
    assert parse("New Game Plus") == parse("new game plus")


@pytest.mark.parametrize("raw", ["ng", "new game", "new game p nano"])
def test_bare_ng_and_new_game_stay_plain_words(raw):
    """The client shows the base cycle as "NG", so bare "ng" is that, never NG+.
    "new game" needs at least the "p" of plus, and only at the end of the query,
    where it is still being typed."""
    parsed = parse(raw)
    assert NG not in parsed["all_q"]
    assert parsed["concept_words"] == set()
    assert parsed["plain"] == raw.split()


def test_the_ng_alias_keeps_the_other_words():
    parsed = parse("nano suit ng+")
    assert parsed["all_q"] == f"'nano' & {NG}"
    assert parsed["last"] == "suit"
    assert parsed["plain"] == ["nano", "suit"]


@pytest.mark.parametrize("raw, phrase", [
    ("nano suit ng+", f"'nano' <-> 'suit' <-> {NG_PHRASE}"),
    ("nano suit new game p", f"'nano' <-> 'suit' <-> {NG_PHRASE}"),
    ("nano ng+ suit", f"'nano' <-> {NG_PHRASE} <-> 'suit'"),
    ("ng+ nano suit", f"{NG_PHRASE} <-> 'nano' <-> 'suit'"),
    ("new game plus nano suit", f"{NG_PHRASE} <-> 'nano' <-> 'suit'"),
    ("ng+ ng++ nano", f"{NG_PHRASE} <-> 'nano'"),     # spellings typed together are one alias
])
def test_the_phrase_puts_the_ng_alias_where_it_was_typed(raw, phrase):
    """The phrase boost needs the words in the order a page has them. With the alias
    always placed before the last word, "nano suit ng+" asked for "nano new game suit"."""
    assert parse(raw)["phrase_q"] == phrase


# ---------------------------------------------------------------------------
# Outfit, appearance and Eve aliases
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("raw, terms, last", [
    ("black skin", ["'black'", OUTFIT], ""),
    ("red costumes", ["'red'", OUTFIT], ""),
    ("lily outfit", ["'lily'", OUTFIT], ""),
    ("drone appearance", ["'drone'", APPEARANCE], ""),
    # an outfit word next to "drone" means a Drone Appearance, wherever "drone" is
    ("drone skin", ["'drone'", APPEARANCE], ""),
    ("skin drone", [APPEARANCE], "drone"),
    # "eve" next to an outfit or suit word means a nano suit
    ("eve outfits", [EVE_OUTFIT, OUTFIT], ""),
    ("eve suit", [EVE_OUTFIT], "suit"),
    ("black eve suits", ["'black'", EVE_OUTFIT], "suits"),
    # alone, or beside anything else, "eve" is a plain word
    ("eve", [], "eve"),
    ("eve nano", ["'eve'"], "nano"),
])
def test_each_concept_replaces_only_its_own_word(raw, terms, last):
    parsed = parse(raw)
    assert parsed["all_q"] == " & ".join(terms)
    assert parsed["any_q"] == " | ".join(terms)
    assert parsed["last"] == last


@pytest.mark.parametrize("word, concept", [
    ("skin", OUTFIT), ("skins", OUTFIT), ("costume", OUTFIT), ("costumes", OUTFIT),
    ("outfit", OUTFIT), ("outfits", OUTFIT), ("appearance", APPEARANCE), ("appearances", APPEARANCE),
])
def test_an_alias_only_adds_to_the_word_typed(word, concept):
    """The expansion holds the word itself (in the singular, which the english config
    stems the plural to), and the literal query keeps exactly what was typed."""
    parsed = parse(f"black {word}")
    assert parsed["all_q"] == f"'black' & {concept}"
    assert f"'{word.removesuffix('s')}'" in concept
    assert parsed["lit_q"] == f"'black' & '{word}'"


def test_appearance_is_never_added_to_the_outfit_words():
    """It triggers its own list only, so Drone Appearances stay out of "outfits",
    "skin" and "costumes"."""
    assert "'appearance'" not in OUTFIT
    for word in ("skin", "outfits", "costumes"):
        assert "'appearance'" not in parse(word)["all_q"]


@pytest.mark.parametrize("raw, words", [
    ("nano", set()),
    ("skin", {"skin", "outfit", "costume", "nano suit", "appearance"}),
    ("eve suit", {"nano suit"}),
    ("eve outfit", {"skin", "outfit", "costume", "nano suit", "appearance"}),
    ("ng+ eve", {"new game", "ng"}),
])
def test_alias_words_for_snippets(raw, words):
    """What a snippet may show as the match when no typed word is in the text."""
    assert parse(raw)["concept_words"] == words


# ---------------------------------------------------------------------------
# The word being typed
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("raw, last, all_q", [
    ("a", "a", ""),
    ("the l", "l", "'the'"),
    ("memory 2", "2", "'memory'"),
    ("legionnaires", "legionnaires", ""),
    ("tumbler expansion modules", "modules", "'tumbler' & 'expansion'"),
    # a concept word is never the half-typed one: it is matched as its alias
    ("black skin", "", f"'black' & {OUTFIT}"),
    ("drone appearances", "", f"'drone' & {APPEARANCE}"),
])
def test_the_last_word_is_the_one_being_typed_whatever_its_length(raw, last, all_q):
    parsed = parse(raw)
    assert parsed["last"] == last
    assert parsed["all_q"] == all_q


def test_the_last_word_counts_as_a_term():
    assert parse("tumbler expansion modules")["n_terms"] == 3
    assert parse("black skin")["n_terms"] == 2


@pytest.mark.parametrize("apostrophe", ["'", CURLY_APOSTROPHE], ids=["straight", "curly"])
@pytest.mark.parametrize("name", ["eve", "lyle"])
def test_a_possessive_loses_its_s(name, apostrophe):
    assert parse(f"{name}{apostrophe}s")["last"] == name
    parsed = parse(f"{name}{apostrophe}s shop")
    assert parsed["all_q"] == f"'{name}'"
    assert parsed["plain"] == [name, "shop"]


def test_a_possessive_eve_still_takes_the_eve_alias():
    assert parse("eve's outfit")["all_q"] == f"{EVE_OUTFIT} & {OUTFIT}"


# ---------------------------------------------------------------------------
# Split compounds: the last two words joined
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("raw, joined, all_j", [
    ("memory sticks", "memorysticks", ""),
    ("black nano suit", "nanosuit", "'black'"),
    ("skin memory sticks", "memorysticks", OUTFIT),
    ("ng+ memory sticks", "memorysticks", NG),
    ("eve sticks", "evesticks", ""),            # no outfit or suit word, so "eve" is plain
])
def test_the_last_two_plain_words_are_also_tried_joined(raw, joined, all_j):
    """all_j is every term but the word joined into the compound, so the compound can
    stand in for the two words it replaces."""
    parsed = parse(raw)
    assert parsed["joined"] == joined
    assert parsed["all_j"] == all_j


@pytest.mark.parametrize("raw", [
    "memorysticks",             # one word
    "memory skin",              # the last word is a concept word
    "skin sticks",              # so is the one before it
    "eve suit",                 # and "eve" is one here
    "memory 2", "2 sticks",     # a number never joins
    "memory s",                 # nor does a one-letter last word
])
def test_no_joined_compound(raw):
    parsed = parse(raw)
    assert parsed["joined"] == ""
    assert parsed["all_j"] == ""


# ---------------------------------------------------------------------------
# Nothing typed becomes tsquery syntax
# ---------------------------------------------------------------------------

CONSTANTS = (OUTFIT, APPEARANCE, EVE_OUTFIT, NG, NG_PHRASE)
_TERM = r"(?:'[^\W_]+'|" + "|".join(re.escape(c) for c in CONSTANTS) + ")"
# Quoted words and the fixed constants, joined by one operator with a space each side.
TSQUERY = re.compile(_TERM + r"(?: (?:&|\||<->) " + _TERM + ")*")
TSQUERY_KEYS = ("all_q", "any_q", "lit_q", "phrase_q", "all_j")
WORD_KEYS = ("last", "joined")

_PIECES = [
    "&", "|", "!", "(", ")", ":", "*", ":*", "<->", "<2>", "<-", "->", "'", "''", '"', "\\", "\\'",
    "a & b", "!x", "(y|z)", "'nano' <-> 'suit'", "x:*", "[[a|b]]", "'; drop table x; --", "%", "_", "-",
    "ng+", "new game", "plus", "p", "skin", "outfits", "appearance", "eve", "eve's", "drone", "suit",
    "nano", "memory", "sticks", "the", "a", "2", "82",
    " ", "  ", "\t", NBSP, IDEOGRAPHIC_SPACE, ZERO_WIDTH_SPACE, SOFT_HYPHEN, CURLY_APOSTROPHE, chr(0), chr(1),
    chr(0xE9), chr(0x3B2), chr(0x65E5) + chr(0x672C), fullwidth("nano"), chr(0x2605), chr(0x2026), chr(0x1F600),
]


def _hostile_corpus():
    fixed = ["", " ", "!!!", "((:*", "'", '"', "\\", "&|!", "<->", "<2>", ":*", "a & b", "a | !b",
             "!(a | b)", "'nano' <-> 'suit'", "nano:*", "a <2> b", "ng+ & skin", "eve's | 'outfit'"]
    rng = random.Random(3616)
    generated = ["".join(rng.choice(_PIECES) + rng.choice(("", " ")) for _ in range(rng.randint(1, 8)))
                 for _ in range(3000)]
    return fixed + generated


def test_the_constants_are_quoted_words_and_operators_only():
    for constant in CONSTANTS:
        assert re.fullmatch(r"\( '[a-z]+'(?: (?:\||<->) '[a-z]+')* \)", constant), constant


def test_hostile_input_never_becomes_tsquery_syntax():
    reached = set()
    for raw in _hostile_corpus():
        parsed = parse(raw)
        for key in TSQUERY_KEYS:
            assert parsed[key] == "" or TSQUERY.fullmatch(parsed[key]), (raw, key, parsed[key])
        for key in WORD_KEYS:
            assert re.fullmatch(r"[^\W_]*", parsed[key]), (raw, key, parsed[key])
        reached |= {key for key in TSQUERY_KEYS + WORD_KEYS if parsed[key]}
    # The corpus reaches every part, so no check above passes only by being empty.
    assert reached == set(TSQUERY_KEYS + WORD_KEYS)


# ---------------------------------------------------------------------------
# "guide": optional when the rest of the query names something
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("q, terms", [
    ("eidos 7 guide", "eidos 7"),
    ("xion guide", "xion"),
    ("fishing guides", "fishing"),
    ("guide to xion", "to xion"),
    ("prayer meeting guide", "prayer meeting"),   # still exact: the whole query decides exact titles
    ("7 guide", "7"),
])
def test_guide_drops_out_of_the_words_that_must_match(q, terms):
    assert search.search_terms(q) == terms


@pytest.mark.parametrize("q", [
    "guide", "guides", "the guide", "a guide",   # nothing, or only stopwords, would be left
    "eve guide", "dlc guide",                    # three letters is too little to stand alone
    "guidebook", "guided tour", "guid",          # not the word itself
    "xion",                                      # no "guide" at all
])
def test_guide_stays_when_too_little_is_left(q):
    assert search.search_terms(q) == q


# ---------------------------------------------------------------------------
# Typo fallback: distance, edit limits, correction
# ---------------------------------------------------------------------------

def _osa_reference(a, b):
    """Optimal string alignment distance from the full table, with no band."""
    d = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        d[i][0] = i
    for j in range(len(b) + 1):
        d[0][j] = j
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] != b[j - 1]))
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                d[i][j] = min(d[i][j], d[i - 2][j - 2] + 1)
    return d[-1][-1]


def test_osa_counts_single_edits():
    assert search._osa("nano", "nano", 0) == 0
    assert search._osa("nano", "nana", 1) == 1      # substitution
    assert search._osa("nano", "nanos", 1) == 1     # insertion
    assert search._osa("nanos", "nano", 1) == 1     # deletion
    assert search._osa("", "abc", 3) == 3


def test_osa_counts_a_swap_of_neighbours_as_one_edit():
    """Levenshtein would put "fihsing" two edits from "fishing"."""
    assert search._osa("fihsing", "fishing", 1) == 1
    assert search._osa("ab", "ba", 1) == 1


def test_osa_gives_up_at_k_plus_one():
    # The lengths alone settle it.
    assert search._osa("ab", "abcdefg", 2) == 3
    # A row with every cell past k: the distance can only grow from there.
    assert search._osa("abcdef", "uvwxyz", 1) == 2
    # With room for it, the full distance.
    assert search._osa("abcdef", "uvwxyz", 6) == 6


def test_osa_is_exact_inside_the_band_and_never_inside_it_otherwise():
    words = ["".join(p) for n in range(5) for p in itertools.product("abc", repeat=n)]
    for a in words:
        for b in words:
            distance = _osa_reference(a, b)
            for k in range(4):
                got = search._osa(a, b, k)
                assert got == distance if distance <= k else got > k, (a, b, k, got, distance)


@pytest.mark.parametrize("length, words, edits", [
    (4, 1, 0), (4, 3, 0),
    (5, 1, 1), (7, 1, 1), (7, 3, 1),
    (8, 1, 2), (9, 1, 2),
    (8, 2, 3), (9, 4, 3),           # another word has to agree, which keeps a third edit safe
    (10, 1, 3), (16, 1, 3),
])
def test_edits_allowed_by_length_and_word_count(length, words, edits):
    assert search._max_edits(length, words) == edits


class _VocabSession:
    """Answers _correct's vocabulary query with titles, and records each call."""

    def __init__(self, titles=()):
        self.titles = list(titles)
        self.calls = []

    async def execute(self, stmt, params=None):
        assert stmt is search._VOCAB_SQL, stmt
        self.calls.append(params)
        result = MagicMock()
        result.all.return_value = [(title,) for title in self.titles]
        return result


async def test_a_correction_needs_the_corrected_words_in_one_title():
    session = _VocabSession(["Boss Challenge", "Boss: Scarlet"])
    assert await search._correct(session, "boss challgen") == "boss challenge"
    assert session.calls == [search._vocab_params()]
    # The same words, never in one title: no correction.
    apart = _VocabSession(["Boss: Scarlet", "Challenge Accepted"])
    assert await search._correct(apart, "boss challgen") is None


async def test_numbers_and_known_words_are_kept_as_typed():
    assert await search._correct(_VocabSession(["Sentinel 82", "Sentry Gun"]), "sentinal 82") == "sentinel 82"
    # Nothing misspelt: nothing to correct.
    assert await search._correct(_VocabSession(["Boss Challenge"]), "boss challenge") is None


@pytest.mark.parametrize("q", [
    "boss cat",             # no word of 5+ letters, so none may be edited
    "12345 67890",          # numbers are never edited
    "a b c d challgen",     # more than 4 words
    "", "!!!",
])
async def test_no_vocabulary_query_when_nothing_can_be_corrected(q):
    session = _VocabSession(["Boss Challenge", "Fishing"])
    assert await search._correct(session, q) is None
    assert session.calls == []


async def test_at_most_256_combinations_are_tried(monkeypatch):
    """Four misspelt words with five equally near candidates each make 625
    combinations, and only the last puts every word in one title. Without the cap
    the fallback would find it; with it, 256 are tried and the fallback gives up."""
    stems, ends = "abcd", "vwxyz"
    titles = [stem * 4 + end for stem in stems for end in ends[:-1]]   # one candidate per title
    titles.append(" ".join(stem * 4 + ends[-1] for stem in stems))     # the last candidates share one
    tried = []

    def counting_product(*options):
        for combo in itertools.product(*options):
            tried.append(combo)
            yield combo

    monkeypatch.setattr(search, "itertools", SimpleNamespace(product=counting_product, islice=itertools.islice))
    q = " ".join(stem * 4 + "q" for stem in stems)                    # "aaaaq bbbbq ccccq ddddq"

    assert await search._correct(_VocabSession(titles), q) is None
    assert len(tried) == 256


# ---------------------------------------------------------------------------
# The statement, and the link pattern it shares with the index
# ---------------------------------------------------------------------------

def test_the_statement_binds_exactly_the_parameters_search_passes():
    params = search._search_params("nano suit", search.build_query("nano suit"), 20)
    assert len(params) == 17
    assert set(search._SEARCH_SQL.compile().params) == set(params)


def test_each_trigram_and_rank_measure_is_computed_once():
    """similarity() and ts_rank() are the statement's costly measures. A doc's sit in
    base0 and a section title's in section_hits, both MATERIALIZED, so no later CTE
    computes one again; a section reuses its page's rank."""
    sql = search._SEARCH_SQL.text
    base0 = sql[sql.index("base0 AS MATERIALIZED ("):sql.index("\nbase AS (")]
    section_hits = sql[sql.index("section_hits AS MATERIALIZED ("):sql.index("\nhits AS (")]
    assert base0.count("similarity(") == 4 and section_hits.count("similarity(") == 1
    assert sql.count("similarity(") == 5
    assert sql.count("ts_rank(") == base0.count("ts_rank(") == 2


def test_search_and_search_text_share_one_strip_links():
    assert search._strip_links is search_text.strip_links
