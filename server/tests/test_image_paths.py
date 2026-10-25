"""Unit tests for the copy-paste authoring path normalizer
(scripts/images/paths.py)."""
from scripts.images.paths import local_image_paths, normalize_image_path, normalize_content_images

CANON = '/assets/images/Eidos_7/Silent_Street/Stellar Blade_20240514035151.jpg'
R2_URL = 'https://img.stellarbladeguide.com/stellar-blade/collectibles/eidos-7/silent-street/stellar-blade-20240514035151.webp'


def test_mac_absolute_path_normalizes():
    assert normalize_image_path(
        '/Users/me/dev/stellar-blade-guide/client/public/assets/images/Eidos_7/Silent_Street/Stellar Blade_20240514035151.jpg'
    ) == CANON


def test_devcontainer_absolute_path_normalizes():
    assert normalize_image_path(
        '/workspaces/stellar-blade-guide/client/public/assets/images/Eidos_7/Silent_Street/Stellar Blade_20240514035151.jpg'
    ) == CANON


def test_canonical_path_passes_through():
    assert normalize_image_path(CANON) == CANON


def test_r2_url_passes_through():
    assert normalize_image_path(R2_URL) == R2_URL


def test_markerless_garbage_passes_through():
    assert normalize_image_path('not/a/path.jpg') == 'not/a/path.jpg'


def test_none_passes_through():
    assert normalize_image_path(None) is None


def test_marker_twice_splits_on_first():
    # pinned behavior: everything after the FIRST marker occurrence survives
    twice = '/backup/client/public/assets/images/client/public/assets/images/X/Y.jpg'
    assert normalize_image_path(twice) == '/assets/images/client/public/assets/images/X/Y.jpg'


def test_content_walker_normalizes_nested_images_only():
    content = [
        {'section_title': 'client/public/assets/images/ mentioned in prose',
         'text': 'no touch',
         'images': [
             {'url': '/workspaces/stellar-blade-guide/client/public/assets/images/A/B.jpg',
              'alt': 'stays'},
             {'url': R2_URL},
         ]},
        {'text': 'block without images'},
        {'images': None},
    ]
    out = normalize_content_images(content)
    assert out[0]['images'][0]['url'] == '/assets/images/A/B.jpg'
    assert out[0]['images'][0]['alt'] == 'stays'
    assert out[0]['images'][1]['url'] == R2_URL
    assert out[0]['section_title'] == 'client/public/assets/images/ mentioned in prose'


def test_content_walker_handles_empty():
    assert normalize_content_images(None) is None
    assert normalize_content_images([]) == []


def test_local_image_paths_finds_every_local_form_at_any_depth():
    """A path the URL swap never turned into an R2 URL works on dev and breaks on prod, so the
    seeders' --check looks for it in every field, however deep."""
    entry = {
        'title': "Luke's Memory",
        'images': [{'url': CANON}, {'url': R2_URL}],
        'thumbnail_url': '/workspaces/stellar-blade-guide/client/public/assets/images/A/b.png',
        'content': [{'images': [{'url': '/Users/me/x/client/public/assets/images/C/d.JPG'}],
                     'section_title': 'client/public/assets/images/ mentioned in prose'}],
    }
    assert local_image_paths(entry) == [
        CANON,
        '/workspaces/stellar-blade-guide/client/public/assets/images/A/b.png',
        '/Users/me/x/client/public/assets/images/C/d.JPG',
    ]


def test_a_swapped_entry_and_prose_hold_no_local_path():
    entry = {'images': [{'url': R2_URL}], 'description': {'type': 'text', 'content': 'See /assets/images/x.jpg'},
             'notes': ['/assets/images/', '/assets/images/folder', None, 3]}
    assert local_image_paths(entry) == []
