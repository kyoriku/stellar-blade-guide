"""
Why a body-only hit came up (app/services/search.py): the fragment a snippet shows,
the section a walkthrough result links, and the tags an item found by its type, place
or cycle carries.

The narrowest results row shows about VISIBLE (44) characters, so the match has to land
inside them. Pure functions, plus _execute_search on a fake session where the
statement's stems column decides the match words: no app, no database and no Redis.
"""
from unittest.mock import MagicMock

import pytest

from app.services import search
from app.services.search import VISIBLE, build_query

# Characters kept out of the source as literals.
ELLIPSIS = chr(0x2026)   # marks a fragment that starts partway through its text
DOT = chr(0xB7)          # joins a snippet's type, place and cycle tags
ALPHA, BETA, GAMMA = chr(0x3B1), chr(0x3B2), chr(0x3B3)

OMNIBOLT = search._match_rx(["omnibolt"])
OUTFIT_WORDS = search._match_rx(build_query("skin")["concept_words"])   # what "skin" may show


# ---------------------------------------------------------------------------
# The fragment
# ---------------------------------------------------------------------------

LONG = ("Climb the ladder at the end of the long corridor, then turn left and grab "
        "the omnibolt from the shelf beside the crates near the door.")


def test_a_match_far_into_the_text_is_brought_into_view_with_a_word_of_lead_in():
    fragment = search._fragment(LONG, [OMNIBOLT], VISIBLE)
    assert fragment == ELLIPSIS + "the omnibolt from the shelf beside the crates near the door."
    assert "omnibolt" in fragment[:VISIBLE]


def test_a_long_word_is_not_kept_as_lead_in():
    text = LONG.replace("grab the", "unquestionably")     # more than a third of the room
    assert search._fragment(text, [OMNIBOLT], VISIBLE) == (
        ELLIPSIS + "omnibolt from the shelf beside the crates near the door.")


def test_the_first_word_is_kept_as_lead_in_too():
    """Keeping it shows the text from its start, so there is nothing to elide."""
    text = "Find omnibolt behind the crates in the far corner of the warehouse, past the broken lift."
    assert search._fragment(text, [OMNIBOLT], VISIBLE) == text


def test_a_match_near_the_end_shows_what_leads_up_to_it():
    text = ("Climb the ladder at the end of the long corridor, then turn left past the crates "
            "and grab the omnibolt.")
    fragment = search._fragment(text, [OMNIBOLT], VISIBLE)
    assert fragment == ELLIPSIS + "left past the crates and grab the omnibolt."
    assert len(fragment) <= VISIBLE


def test_a_match_at_the_start_needs_no_ellipsis():
    text = "Omnibolt sits behind the crates."
    assert search._fragment(text, [OMNIBOLT], VISIBLE) == text


def test_no_match_no_fragment():
    assert search._fragment(LONG, [search._match_rx(["crowbar"])], VISIBLE) is None
    assert search._fragment(LONG, [None], VISIBLE) is None
    assert search._fragment("", [OMNIBOLT], VISIBLE) is None
    assert search._fragment(None, [OMNIBOLT], VISIBLE) is None


OUTFIT_TEXT = ("Wear the outfit you like, then climb the long ladder to the roof and pick up "
               "the omnibolt from the shelf by the door.")


def test_typed_words_win_over_alias_words():
    """The alias word comes first in the text, but the typed word places the fragment."""
    fragment = search._fragment(OUTFIT_TEXT, [OMNIBOLT, OUTFIT_WORDS], VISIBLE)
    assert fragment == ELLIPSIS + "up the omnibolt from the shelf by the door."


@pytest.mark.parametrize("typed", [None, search._match_rx(["crowbar"])], ids=["no typed word", "none in the text"])
def test_alias_words_place_the_fragment_when_no_typed_word_matches(typed):
    fragment = search._fragment(OUTFIT_TEXT, [typed, OUTFIT_WORDS], VISIBLE)
    assert fragment.startswith(ELLIPSIS + "the outfit you like")


# ---------------------------------------------------------------------------
# Match words come from the statement's stems column
# ---------------------------------------------------------------------------

class _Session:
    """Answers the search statement with one prepared row list."""

    def __init__(self, rows):
        self.rows = rows

    async def execute(self, stmt, params=None):
        assert stmt is search._SEARCH_SQL, stmt
        result = MagicMock()
        result.mappings.return_value.all.return_value = self.rows
        return result


def _row(kind, **fields):
    """One body (tier 2) row of the search statement, shaped like its output."""
    row = {"part": 0, "kind": kind, "id": 1, "title": "Lost Device", "a": "side-quest", "b": "lost-device",
           "type_id": None, "tier": 2, "score": 2.5, "description": None, "cycle": None, "type_name": None,
           "level_name": None, "location_name": None, "subtitle": "The subtitle", "available_after": None,
           "content": None, "extra": [], "n": None, "k1": 0, "k2": 0, "k3": 0, "stems": None}
    return {**row, **fields}


async def test_stopwords_never_become_match_words():
    """The stems column pairs each plain word with its English lexemes, and a stopword
    has none, so only "omnibolt" is matched. Were "the" a match word, the section's
    first "the" would place the fragment and push omnibolt out of view."""
    section = {"order": 1, "section_title": "Storeroom",
               "text": "Open the door at the far end of the long hall and step over the rubble, "
                       "then take the omnibolt from the shelf."}
    stems = [["the", []], ["omnibolt", ["omnibolt"]]]       # json_agg(json_build_array(word, lexemes))
    session = _Session([_row("walkthrough", content=[section], stems=stems)])

    results, _ = await search._execute_search(session, "the omnibolt", 20)

    assert results[0].snippet == "Storeroom: " + ELLIPSIS + "the omnibolt from the shelf."


async def test_alias_words_place_the_snippet_when_nothing_typed_is_plain():
    """"skin" is all alias, so the stems column is NULL and the concept words are the
    only match words."""
    description = {"type": "text", "content": "Sold by Lyle in the Xion market after the second chapter, "
                                              "this one is a racing outfit with gold trim."}
    row = _row("item", a="cosmetics", b="nano-suits", type_id=18, title="Racer", description=description,
               type_name="Nano Suit", stems=None)

    results, _ = await search._execute_search(_Session([row]), "skin", 20)

    assert results[0].snippet == ELLIPSIS + "this one is a racing outfit with gold trim."


# ---------------------------------------------------------------------------
# Walkthrough sections
# ---------------------------------------------------------------------------

def _walkthrough(content, extra=(), available_after=None, subtitle="The subtitle"):
    return {"content": content, "extra": list(extra), "available_after": available_after, "subtitle": subtitle}


@pytest.mark.parametrize("title, label, anchor", [
    # 29 characters: the longest title that fits whole
    ("Finding the Way to the Bridge", "Finding the Way to the Bridge", "finding-the-way-to-the-bridge"),
    ("Finding the Way to the Bridges", "Finding the Way to the Bridg" + ELLIPSIS, "finding-the-way-to-the-bridges"),
    ("The Long Way Round Through the Flooded Commercial Sector", "The Long Way Round Through t" + ELLIPSIS,
     "the-long-way-round-through-the-flooded-commercial-sector"),
])
def test_a_long_section_title_is_shortened_to_leave_room_for_the_match(title, label, anchor):
    section = {"order": 1, "section_title": title,
               "text": "Wade through the water and grab the omnibolt beside the stairs."}

    link, snippet = search._walkthrough_body_snippet(_walkthrough([section]), [OMNIBOLT])

    assert snippet == f"{label}: {ELLIPSIS}omnibolt beside the stairs."
    assert "omnibolt" in snippet[:VISIBLE]
    assert link == anchor             # the link still uses the whole title


@pytest.mark.parametrize("section, anchor", [
    ({"order": 1, "section_title": "Chapter of Trial 1-" + BETA}, "chapter-of-trial-1"),   # Greek dropped
    ({"order": 2, "section_title": "Finding Frank's Bag"}, "finding-franks-bag"),          # apostrophe removed
    ({"order": 3}, "section-3"),                                                             # untitled
    ({"order": 4, "section_title": ""}, "section-4"),                                        # an empty title is none
    ({"order": 5, "section_title": ALPHA + BETA + GAMMA}, None),      # slugifies to nothing: no id to land on
    ({"order": True}, "section-true"),          # a bool, printed the way the page's template string prints it
])
def test_section_anchor(section, anchor):
    assert search._section_anchor(section) == anchor


# ---------------------------------------------------------------------------
# Items found by their type, place or cycle
# ---------------------------------------------------------------------------

def _item(**fields):
    item = {"description": {"type": "text", "content": "Buy them."}, "cycle": "Base", "type_name": "Earrings",
            "location_name": "Silent Street", "level_name": "Eidos 7"}
    return {**item, **fields}


def _tags(*parts):
    return f" {DOT} ".join(part for part in parts if part)


@pytest.mark.parametrize("cycle, shown", [
    ("Base", False), ("NG", False), (None, False),      # the base cycle, under either stored name
    ("NG+", True), ("NG++", True), ("DLC", True),
])
def test_the_cycle_tag_never_shows_the_base_cycle(cycle, shown):
    snippet = search._item_body_snippet(_item(cycle=cycle), [search._match_rx(["earrings"])])
    assert snippet == _tags("Earrings", cycle if shown else None, "Buy them.")


@pytest.mark.parametrize("words, place", [
    (["earrings"], None),                       # only the type matched: no place
    (["street"], "Silent Street"),              # the location matched
    (["eidos"], "Eidos 7"),                     # the level matched
    (["silent", "eidos"], "Silent Street"),     # both: the location, the more precise of the two
])
def test_the_place_tag_needs_a_query_word_in_it(words, place):
    snippet = search._item_body_snippet(_item(), [search._match_rx(words)])
    assert snippet == _tags("Earrings", place, "Buy them.")


def test_a_description_match_shows_the_fragment_and_no_tags():
    snippet = search._item_body_snippet(_item(cycle="NG+"), [search._match_rx(["buy"])])
    assert snippet == "Buy them."
