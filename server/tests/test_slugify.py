from app.services.search import _slugify_title, _build_slug_map


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
