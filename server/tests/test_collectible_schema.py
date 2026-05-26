from schemas.collectibles import CollectibleResponse


def test_collectible_response_subtype_defaults_to_none():
    r = CollectibleResponse(
        id=1, title="Test", description={"type": "text", "content": "x"},
        display_order=1, types=[], images=[]
    )
    assert r.subtype is None


def test_collectible_response_accepts_subtype():
    r = CollectibleResponse(
        id=1, title="Test", description={"type": "text", "content": "x"},
        display_order=1, types=[], images=[], subtype="Prayers"
    )
    assert r.subtype == "Prayers"


def test_collectible_response_serializes_subtype():
    r = CollectibleResponse(
        id=1, title="Test", description={"type": "text", "content": "x"},
        display_order=1, types=[], images=[], subtype="Books"
    )
    dumped = r.model_dump()
    assert "subtype" in dumped
    assert dumped["subtype"] == "Books"


def test_collectible_response_null_subtype_serializes():
    r = CollectibleResponse(
        id=1, title="Test", description={"type": "text", "content": "x"},
        display_order=1, types=[], images=[]
    )
    dumped = r.model_dump()
    assert "subtype" in dumped
    assert dumped["subtype"] is None
