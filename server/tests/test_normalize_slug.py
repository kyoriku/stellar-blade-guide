import pytest
from routes.collectibles import _normalize_slug


@pytest.mark.parametrize("slug,expected", [
    # Real collectible type slugs — covers every type in seed-data/collectibles/
    ("beta-cores",                  "Beta Core"),           # was 'Beta Cor' before fix
    ("body-cores",                  "Body Core"),           # was 'Body Cor' before fix
    ("weapon-cores",                "Weapon Core"),         # was 'Weapon Cor' before fix
    ("documents",                   "Document"),
    ("memorysticks",                "Memorystick"),
    ("nano-suits",                  "Nano Suit"),
    ("passcodes",                   "Passcode"),
    ("exospines",                   "Exospine"),
    ("hairstyles",                  "Hairstyle"),
    ("gears",                       "Gear"),
    ("earrings",                    "Earring"),
    ("camps",                       "Camp"),
    ("cans",                        "Can"),
    ("adam-outfits",                "Adam Outfit"),
    ("lily-outfits",                "Lily Outfit"),
    ("supply-chests",               "Supply Chest"),
    ("drone-upgrade-modules",       "Drone Upgrade Module"),
    ("tumbler-expansion-modules",   "Tumbler Expansion Module"),
    # Sibilant-es plurals — strip 'es'
    ("glasses",                     "Glass"),               # sses
    ("supply-boxes",                "Supply Box"),          # xes
    ("passes",                      "Pass"),                # sses
    # 'ces' ending — NOT a sibilant, strip only 's'
    ("drone-appearances",           "Drone Appearance"),
    # Already singular — unchanged
    ("nano-suit",                   "Nano Suit"),
    ("document",                    "Document"),
])
def test_normalize_slug(slug, expected):
    assert _normalize_slug(slug) == expected
