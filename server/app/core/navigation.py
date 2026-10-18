"""The navigation slugs the server knows, all from client/src/constants/seo.json.

seo.json is the server's copy of client/src/constants/navigation.ts: seo.test.ts pins
its walkthrough types to it, and the Dockerfile copies it into the image. The DB stores
a walkthrough's mission_type in the singular (side-quest), while its URLs use the
navigation slug, which is plural for side quests and bulletin board requests
(side-quests). Everything that builds or checks a walkthrough URL goes through here, so
only that one spelling is produced and every other spelling is redirected to it.
"""
import json
import os
import re

_SEO_JSON_PATH = os.path.join(os.path.dirname(__file__), '../../../client/src/constants/seo.json')

with open(_SEO_JSON_PATH, encoding='utf-8') as _f:
    _seo = json.load(_f)


def normalize_type(walkthrough_type: str) -> str:
    """Normalize plural type slugs to singular DB values.
    e.g. 'side-quests' -> 'side-quest', 'bosses' -> 'boss'
    """
    if walkthrough_type.endswith('es'):
        return walkthrough_type[:-2]
    elif walkthrough_type.endswith('s'):
        return walkthrough_type[:-1]
    return walkthrough_type


# DB mission_type -> URL segment: 'side-quest' -> 'side-quests', 'main-story' -> 'main-story'.
URL_TYPE = {normalize_type(t): t for t in _seo['walkthroughTypes']}


def url_type(mission_type: str) -> str:
    """The URL segment for a DB mission_type. A type not in the navigation (the e2e
    fixture's 'e2e-fixture') passes through unchanged: never pluralised by rule."""
    return URL_TYPE.get(mission_type, mission_type)


def canonical_url_type(segment: str) -> str | None:
    """The canonical segment when `segment` is another spelling of a known type
    (side-quest, side-questes, main-storys), else None. Case-sensitive like the routes,
    so a mixed-case segment is not a spelling of anything and keeps its 404."""
    canonical = URL_TYPE.get(normalize_type(segment))
    return canonical if canonical and canonical != segment else None


# The levels that have a page: seo.json's levels keys, the set seo_head already uses to
# decide a level page is real. The pseudo-levels Default and Boss Challenge are not in it.
NAV_LEVEL_SLUGS = frozenset(_seo['levels'])


def _page_title(title: str) -> str:
    """A seo.json page title without its leading "All N" count, which changes with every seed."""
    return re.sub(r'^All \d+ ', '', title)


# What each page is called besides its name, for search (app/services/search.py): the
# type and level pages' titles from seo.json ("Camp Locations", "Eidos 7 Collectibles").
TYPE_PAGE_TITLES = {slug: _page_title(entry['title'])
                    for group in _seo['types'].values() for slug, entry in group.items()}
LEVEL_PAGE_TITLES = {slug: _page_title(entry['title']) for slug, entry in _seo['levels'].items()}
# The walkthrough categories in navigation order: URL segment -> display name.
WALKTHROUGH_CATEGORIES = {slug: entry['name'] for slug, entry in _seo['walkthroughTypes'].items()}
