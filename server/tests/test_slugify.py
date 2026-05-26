from routes.search import _slugify_title


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
