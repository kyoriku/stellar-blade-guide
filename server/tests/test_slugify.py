from app.services.search import _slugify_title, _build_slug_map, _section_anchor

# Characters kept out of the source as literals.
ALPHA, BETA, GAMMA = chr(0x3B1), chr(0x3B2), chr(0x3B3)


def test_single_star_becomes_1():
    assert _slugify_title("Ranged Enhancement Gear ★ / Supply Box") == "ranged-enhancement-gear-1-supply-box"


def test_double_star_becomes_2():
    assert _slugify_title("Ranged Enhancement Gear ★★ / Supply Box") == "ranged-enhancement-gear-2-supply-box"


def test_triple_star_becomes_3():
    assert _slugify_title("Ranged Enhancement Gear ★★★") == "ranged-enhancement-gear-3"


def test_star_variants_produce_distinct_slugs():
    slugs = {
        _slugify_title("Ranged Enhancement Gear ★ / Supply Box"),
        _slugify_title("Ranged Enhancement Gear ★★ / Supply Box"),
        _slugify_title("Ranged Enhancement Gear ★★★"),
    }
    assert len(slugs) == 3


def test_no_stars_unchanged():
    assert _slugify_title("Supply Camp") == "supply-camp"


def test_apostrophe_stripped():
    assert _slugify_title("Legionnaire 451's Resolution") == "legionnaire-451s-resolution"


def test_build_slug_map_suffixes_duplicates_in_order():
    m = _build_slug_map([(5, "Body Core"), (9, "Body Core"), (12, "Body Core")])
    assert m == {5: "body-core-1", 9: "body-core-2", 12: "body-core-3"}


def test_build_slug_map_leaves_unique_title_bare():
    m = _build_slug_map([(1, "Body Core"), (2, "Supply Camp")])
    assert m == {1: "body-core", 2: "supply-camp"}


def test_build_slug_map_is_order_dependent():
    forward = _build_slug_map([(1, "Supply Box"), (2, "Supply Box")])
    reversed_ = _build_slug_map([(2, "Supply Box"), (1, "Supply Box")])
    assert forward == {1: "supply-box-1", 2: "supply-box-2"}
    assert reversed_ == {2: "supply-box-1", 1: "supply-box-2"}


def test_build_slug_map_star_variants_stay_distinct_and_bare():
    # Distinct base slugs (via ★-count preprocessing) must not be treated as
    # duplicates — each stays bare, no positional suffix.
    m = _build_slug_map([
        (1, "Ranged Enhancement Gear ★ / Supply Box"),
        (2, "Ranged Enhancement Gear ★★ / Supply Box"),
        (3, "Ranged Enhancement Gear ★★★"),
    ])
    assert m == {
        1: "ranged-enhancement-gear-1-supply-box",
        2: "ranged-enhancement-gear-2-supply-box",
        3: "ranged-enhancement-gear-3",
    }


# Walkthrough section ids. Search links straight to a section, so _section_anchor
# mirrors sectionAnchor and slugifySection in client/src/utils/slugify.ts, and
# slugify.test.ts pins the same cases from the client side.

def test_section_anchor_hyphenates_the_words_of_a_title():
    assert _section_anchor({"section_title": "Catching a Whale Shark", "order": 1}) == "catching-a-whale-shark"


def test_section_anchor_removes_apostrophes_rather_than_hyphenating_them():
    assert _section_anchor({"section_title": "Finding Frank's Bag", "order": 2}) == "finding-franks-bag"


def test_section_anchor_drops_the_period_after_a_leading_number():
    assert _section_anchor({"section_title": "1. Vibrant Cat", "order": 1}) == "1-vibrant-cat"


def test_section_anchor_drops_parentheses_at_the_end_of_a_title():
    assert _section_anchor({"section_title": "Belial (First Encounter)", "order": 1}) == "belial-first-encounter"


def test_section_anchor_drops_parentheses_at_the_start_of_a_title():
    assert _section_anchor({"section_title": "(Optional) Finding the Cat", "order": 1}) == "optional-finding-the-cat"


def test_section_anchor_drops_greek_letters_unlike_slugify_title():
    title = "Chapter of Trial 1-" + BETA
    assert _section_anchor({"section_title": title, "order": 1}) == "chapter-of-trial-1"
    assert _slugify_title(title) == "chapter-of-trial-1-" + BETA


def test_untitled_section_anchor_is_section_order():
    assert _section_anchor({"order": 1}) == "section-1"


def test_empty_section_title_counts_as_untitled():
    assert _section_anchor({"section_title": "", "order": 2}) == "section-2"


def test_greek_only_section_title_has_no_anchor():
    # The page gives this section an empty id, which nothing can link to; the client
    # side pins that empty string.
    assert _section_anchor({"section_title": ALPHA + BETA + GAMMA, "order": 3}) is None
