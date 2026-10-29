"""The navigation slugs the server knows (app/core/navigation.py), all from seo.json."""

import json
from pathlib import Path

from app.core.navigation import (
    LEVEL_PAGE_TITLES, NAV_LEVEL_SLUGS, TYPE_PAGE_TITLES, URL_TYPE, WALKTHROUGH_CATEGORIES,
    canonical_url_type, url_type,
)

SEO = json.loads((Path(__file__).resolve().parents[2] / "client/src/constants/seo.json").read_text(encoding="utf-8"))


def test_db_types_map_to_the_navigation_spelling():
    assert url_type("side-quest") == "side-quests"
    assert url_type("bulletin-board-request") == "bulletin-board-requests"
    assert url_type("main-story") == "main-story"


def test_no_navigation_spelling_redirects():
    # A canonical slug that counted as another spelling would redirect to itself.
    for slug in URL_TYPE.values():
        assert canonical_url_type(slug) is None, slug


def test_a_type_outside_the_navigation_passes_through():
    # The e2e fixture's type: never pluralised by rule, never redirected.
    assert url_type("e2e-fixture") == "e2e-fixture"
    assert canonical_url_type("e2e-fixture") is None


def test_mixed_case_is_not_another_spelling():
    assert canonical_url_type("Side-Quest") is None


def test_level_slugs_are_the_levels_with_a_page():
    assert "eidos-7" in NAV_LEVEL_SLUGS
    assert not {"default", "boss-challenge"} & NAV_LEVEL_SLUGS


# Search finds the type and level pages by their titles too ("Camp Locations",
# "Eidos 7 Collectibles"), so every page needs one, without the "All 91" count that
# changes with the content.

def test_every_type_page_has_a_title_for_search():
    titles = {slug: entry["title"] for group in SEO["types"].values() for slug, entry in group.items()}
    assert set(TYPE_PAGE_TITLES) == set(titles)
    # A slug in two category groups would leave one of its pages without a title.
    assert len(TYPE_PAGE_TITLES) == sum(len(group) for group in SEO["types"].values())
    for slug, title in TYPE_PAGE_TITLES.items():
        assert title and not title.startswith("All "), slug
        assert titles[slug].endswith(title), slug


def test_every_level_page_has_a_title_for_search():
    assert set(LEVEL_PAGE_TITLES) == set(SEO["levels"]) == NAV_LEVEL_SLUGS
    for slug, title in LEVEL_PAGE_TITLES.items():
        assert title and not title.startswith("All "), slug
        assert SEO["levels"][slug]["title"].endswith(title), slug


def test_every_walkthrough_category_has_its_name_in_navigation_order():
    assert list(WALKTHROUGH_CATEGORIES) == list(SEO["walkthroughTypes"])
    assert list(WALKTHROUGH_CATEGORIES.values()) == [entry["name"] for entry in SEO["walkthroughTypes"].values()]
    assert all(WALKTHROUGH_CATEGORIES.values())
