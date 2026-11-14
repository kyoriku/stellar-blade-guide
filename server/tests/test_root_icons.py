"""The icon names the site answers at its root (app/core/root_icons.py).

One rule for the bot filter, security_headers, and seo_head; their own tests check each one
reads it (test_bot_filter.py, test_cache_control.py, test_seo_head.py).
"""
import struct
from pathlib import Path

import pytest

from app.core.root_icons import TOUCH_ICON, root_icon_file

PUBLIC = Path(__file__).resolve().parents[2] / 'client' / 'public'
FILES = ('favicon.ico', 'apple-touch-icon.png', 'apple-touch-icon-precomposed.png')


@pytest.mark.parametrize('path, file', [
    ('/favicon.ico', 'favicon.ico'),
    ('/apple-touch-icon.png', 'apple-touch-icon.png'),
    ('/apple-touch-icon-precomposed.png', 'apple-touch-icon-precomposed.png'),
    # Apple's sized names, square, optionally precomposed: each gets the 180 px file.
    ('/apple-touch-icon-152x152.png', 'apple-touch-icon.png'),
    ('/apple-touch-icon-152x152-precomposed.png', 'apple-touch-icon.png'),
    ('/apple-touch-icon-120x120.png', 'apple-touch-icon.png'),
    ('/apple-touch-icon-180x180-precomposed.png', 'apple-touch-icon.png'),
    ('/apple-touch-icon-57x57.png', 'apple-touch-icon.png'),
    ('/apple-touch-icon-10x10.png', 'apple-touch-icon.png'),
    ('/apple-touch-icon-999x999.png', 'apple-touch-icon.png'),
])
def test_each_name_and_the_file_it_gets(path, file):
    assert root_icon_file(path) == file


@pytest.mark.parametrize('path', [
    '/Favicon.ico', '/FAVICON.ICO', '/favicon.ICO', '/Apple-Touch-Icon.png',            # exact case
    '/apple-touch-icon.PNG', '/apple-touch-icon-152x152.PNG', '/apple-touch-icon-152X152.png',
    '/favicon.ico/', '/apple-touch-icon-152x152.png/', '//favicon.ico',                 # slashes
    '/favicon.png', '/favicon', '/favicon.svg', '/apple-touch-icon', '/apple-touch-icon.jpg',
    '/apple-touch-icon-152x120.png',                                                     # not square
    '/apple-touch-icon-152.png', '/apple-touch-icon-152x.png', '/apple-touch-icon-x152.png',
    '/apple-touch-icon-9x9.png', '/apple-touch-icon-1000x1000.png', '/apple-touch-icon-052x052.png',
    '/apple-touch-icon-152x152-precomposed-precomposed.png', '/apple-touch-icon-precomposed-152x152.png',
    '/apple-touch-icon-precomposed-precomposed.png', '/apple-touch-icon--152x152.png',
    '/apple-touch-icon-\uff11\uff15\uff12x\uff11\uff15\uff12.png',                      # full-width digits
    '/apple-touch-icon-1\uff15\uff12x1\uff15\uff12.png',
    '/assets/favicon.ico', '/levels/favicon.ico',                                        # not at the root
    '/favicon.ico?v=1', '/favicon.ico#x', '/favicon.ico.', '/favicon.ico\n',             # never cut short
    '', '/',
])
def test_any_other_path_gets_nothing(path):
    assert root_icon_file(path) is None


def test_every_file_it_names_ships_from_client_public():
    # Vite copies client/public into the build as it is.
    assert {root_icon_file(f'/{name}') for name in FILES} == set(FILES)
    for name in FILES:
        assert (PUBLIC / name).is_file(), name


def test_the_sized_names_get_a_180_px_icon():
    # A PNG's width and height open its IHDR chunk, after the 8-byte signature.
    head = (PUBLIC / TOUCH_ICON).read_bytes()[:24]
    assert (head[:8], head[12:16]) == (b'\x89PNG\r\n\x1a\n', b'IHDR')
    assert struct.unpack('>II', head[16:24]) == (180, 180)


def test_the_root_touch_icons_match_the_linked_one():
    # One touch icon in three places, so a new icon replaces all three.
    linked = (PUBLIC / 'assets' / 'favicon' / TOUCH_ICON).read_bytes()
    for name in (TOUCH_ICON, 'apple-touch-icon-precomposed.png'):
        assert (PUBLIC / name).read_bytes() == linked, name
