"""The navigation slugs the server knows (app/core/navigation.py), all from seo.json."""

from app.core.navigation import NAV_LEVEL_SLUGS, URL_TYPE, canonical_url_type, url_type


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
