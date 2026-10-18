"""Site search: one statement over every collectible, walkthrough and page.

Collectibles and walkthroughs are matched through their stored `search_vector`
columns, built from app/services/search_text.py, plus what the statement folds in
at query time: an item's type names and category, and its level and location.
Type, category and level pages are matched by their names and page titles.

Results are tiered (see _SEARCH_SQL): every word in a title or name, then a near
title, then every word anywhere, then any word in a title when nothing else
matched. A query with no result holding every word gets one typo correction
(_correct) and runs again. Body-only hits get a snippet showing the match and,
for a walkthrough, a link to the section it is in.
"""
import itertools
import json
import re
import unicodedata
from collections import defaultdict

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.navigation import (
    LEVEL_PAGE_TITLES, NAV_LEVEL_SLUGS, TYPE_PAGE_TITLES, URL_TYPE, WALKTHROUGH_CATEGORIES, url_type,
)
from app.schemas.search import SearchResult
from app.services.search_text import (
    BASE_CYCLES, both_configs, description_strings, list_strings, section_text, strip_links,
)

_strip_links = strip_links


# ---------------------------------------------------------------------------
# The query text
# ---------------------------------------------------------------------------

def normalize_search_query(q: str) -> str:
    """The text search runs, caches and logs: NFKC (full-width letters and ideographic
    spaces become ASCII), format characters (zero-width, soft hyphen) dropped,
    whitespace collapsed, lowercased, at most 100 characters (the cut can't leave a
    trailing space)."""
    q = unicodedata.normalize("NFKC", q)
    q = "".join(ch for ch in q if unicodedata.category(ch) != "Cf")
    return " ".join(q.split()).lower()[:100].rstrip()


# New Game Plus in every spelling players use, including a trailing "new game p..."
# being typed. The parser drops "+", so NG+ only survives through this alias.
_NG_RX = re.compile(
    r"(?:\bnew\s*game|\bng)\s*(?:\+\+|\+|plus\s+plus\b|plus\b)|\bnewgame\s*\+|\bnew\s+game\s+p(?:l(?:u)?)?$"
)
_OUTFIT_WORDS = frozenset({"skin", "skins", "costume", "costumes", "outfit", "outfits"})
_APPEARANCE_WORDS = frozenset({"appearance", "appearances"})
_SUIT_WORDS = frozenset({"suit", "suits"})
# The only tsquery text that isn't a quoted word. "appearance" triggers its list but
# is never added to the others', so Drone Appearances stay out of "outfits".
OUTFIT = "( 'skin' | 'outfit' | 'costume' | 'nano' <-> 'suit' )"
APPEARANCE = "( 'appearance' | 'skin' | 'outfit' | 'costume' | 'nano' <-> 'suit' )"
EVE_OUTFIT = "( 'eve' | 'nano' <-> 'suit' )"
NG = "( 'new' <-> 'game' | 'ng' )"
NG_PHRASE = "( 'new' <-> 'game' )"
_OUTFIT_SNIPPET_WORDS = ("skin", "outfit", "costume", "nano suit", "appearance")


def build_query(q: str) -> dict:
    """The tsquery parts of a normalized query.

    Words are runs of letters and digits, each passed quoted, so nothing typed can
    become tsquery syntax. Every word must match; the last one is the word being
    typed and matches as a prefix (search_text and _SEARCH_SQL decide how). The
    phrase, which only ranks, keeps the typed order, the New Game Plus alias included.
    Aliases only ever add: outfit words also mean the outfit types and nano suits,
    "eve" next to an outfit or suit word means a nano suit, an outfit word next to
    "drone" means a Drone Appearance, and New Game Plus means "new game" or "ng".
    """
    ng = bool(_NG_RX.search(q))
    # The words in typed order, with None where a New Game Plus spelling was typed
    # (once for several in a row). Only the phrase reads the positions.
    typed = []
    for i, segment in enumerate(_NG_RX.split(q)):
        if i and typed[-1:] != [None]:
            typed.append(None)
        segment = re.sub(r"['’]s\b", "", segment)             # possessive: "eve's" -> "eve"
        typed += re.findall(r"[^\W_]+", segment)
    toks = [t for t in typed if t is not None]
    dressy = any(t in _OUTFIT_WORDS or t in _APPEARANCE_WORDS for t in toks)
    eve_dressy = dressy or any(t in _SUIT_WORDS for t in toks)
    droney = "drone" in toks                                  # "drone skin" means a Drone Appearance

    def concept(t):
        if t in _OUTFIT_WORDS:
            return APPEARANCE if droney else OUTFIT
        if t in _APPEARANCE_WORDS:
            return APPEARANCE
        if t == "eve" and eve_dressy:
            return EVE_OUTFIT
        return None

    last = toks.pop() if toks and concept(toks[-1]) is None else ""   # the word being typed, any length
    terms = [concept(t) or f"'{t}'" for t in toks]
    parts = terms + ([NG] if ng else [])
    # "nano suit ng+" asks for 'nano' <-> 'suit' <-> NG_PHRASE, in the order typed.
    phrase = [NG_PHRASE if t is None else concept(t) or f"'{t}'" for t in typed]
    plain = [t for t in toks if concept(t) is None] + ([last] if last else [])
    concept_words = (({"new game", "ng"} if ng else set()) | (set(_OUTFIT_SNIPPET_WORDS) if dressy else set())
                     | ({"nano suit"} if eve_dressy and "eve" in toks else set()))
    # The last two plain words joined, tried as well: "memory sticks" -> memorysticks.
    joined = (toks[-1] + last) if (len(last) >= 2 and toks and concept(toks[-1]) is None
                                   and not toks[-1].isdigit() and not last.isdigit()) else ""
    all_j = " & ".join(terms[:-1] + ([NG] if ng else [])) if joined else ""
    return dict(
        all_q=" & ".join(parts), any_q=" | ".join(parts),
        lit_q="" if ng else " & ".join(f"'{t}'" for t in toks),
        phrase_q=" <-> ".join(phrase) if (len(phrase) >= 2 or ng) else "",
        last=last, joined=joined, all_j=all_j, n_terms=len(parts) + bool(last),
        empty=not (parts or last), plain=plain, concept_words=concept_words,
    )


# ---------------------------------------------------------------------------
# The statement
# ---------------------------------------------------------------------------

_CATEGORY_SLUGS = list(WALKTHROUGH_CATEGORIES)
_CATEGORY_NAMES = list(WALKTHROUGH_CATEGORIES.values())
_CATEGORY_TYPES = [{segment: mission for mission, segment in URL_TYPE.items()}[slug] for slug in _CATEGORY_SLUGS]
_TYPE_TITLES = json.dumps(TYPE_PAGE_TITLES)
_LEVEL_TITLES = json.dumps(LEVEL_PAGE_TITLES)


def _names(column: str) -> str:
    return "(" + both_configs(column, "A") + ")"


# Tiers, best first. 4: every word in the title or name (subtitle included for a
# walkthrough), split the parser's way or Postgres's, or the exact title; or every
# word in the title plus the doc's own type names, at least one in the title, scored
# 0.30 lower. 3: a whole-title typo, by trigram similarity; when some result holds
# every word, a near title stays here only at similarity 0.8 and otherwise drops to
# 1. 2: every word anywhere: title, body, type, place. 1: those near titles, or, only
# when nothing reached tiers 2-4, titles with any word.
_SEARCH_SQL = text(f"""
WITH p AS (SELECT CAST(:q AS text) AS q, CAST(:all_q AS text) AS all_q, CAST(:any_q AS text) AS any_q, CAST(:lit_q AS text) AS lit_q,
                  CAST(:phrase_q AS text) AS phrase_q, CAST(:last AS text) AS last, CAST(:n_terms AS int) AS n_terms,
                  CAST(:joined AS text) AS joined, CAST(:all_j AS text) AS all_j),
i AS MATERIALIZED (
  SELECT p.q, p.n_terms,
    coalesce(to_tsquery('english', nullif(p.all_q, '')), ''::tsquery) AS base_q,
    coalesce(to_tsquery('english', nullif(p.lit_q, '')), ''::tsquery) AS lit_q,
    CASE WHEN p.last = '' THEN ''::tsquery
         WHEN numnode(to_tsquery('english', quote_literal(p.last))) = 0 THEN to_tsquery('simple', quote_literal(p.last) || ':*')
         ELSE to_tsquery('english', quote_literal(p.last) || ':*') || to_tsquery('simple', quote_literal(p.last) || ':*') END
      -- a word typed past its stem ("fishin") also matches the stem ("fish")
      || (SELECT coalesce(to_tsquery('english', string_agg(DISTINCT quote_literal(st), ' | ')), ''::tsquery)
          FROM unnest(ARRAY[p.last || 'g', p.last || 'ng', p.last || 's', p.last || 'es']) w(w), unnest(ts_lexize('english_stem', w.w)) st(st)
          WHERE p.last <> '' AND length(st) >= 3 AND length(st) < length(p.last) AND left(p.last, length(st)) = st) AS last_title,
    CASE WHEN length(p.last) < 2 OR numnode(to_tsquery('english', quote_literal(p.last))) = 0 THEN ''::tsquery
         WHEN p.n_terms >= 2 OR length(p.last) >= 4 THEN to_tsquery('english', quote_literal(p.last) || ':*') || to_tsquery('simple', quote_literal(p.last) || ':*')
         ELSE to_tsquery('english', quote_literal(p.last)) END AS last_body,
    coalesce(to_tsquery('english', nullif(p.any_q, '')), ''::tsquery) AS any_q,
    CASE WHEN p.phrase_q = '' THEN ''::tsquery ELSE to_tsquery('english', p.phrase_q) END AS phrase_q,
    -- only stopwords before a 1-2 letter word ("an e", "the l"): match them as typed in titles
    CASE WHEN length(p.last) BETWEEN 1 AND 2 AND p.all_q <> '' AND numnode(to_tsquery('english', p.all_q)) = 0 THEN to_tsquery('simple', p.all_q) END AS stop_base,
    -- the last two words joined ("memory sticks" -> memorysticks:*), as a match-only alternative
    CASE WHEN p.joined = '' THEN NULL ELSE coalesce(to_tsquery('english', nullif(p.all_j, '')), ''::tsquery)
         && (to_tsquery('english', quote_literal(p.joined) || ':*') || to_tsquery('simple', quote_literal(p.joined) || ':*')) END AS jq
  FROM p),
qq AS MATERIALIZED (
  SELECT q, n_terms, CASE WHEN stop_base IS NOT NULL THEN stop_base && last_title ELSE base_q && last_title END AS tq_title, lit_q && last_title AS tq_lit, base_q && last_body AS tq_body,
         any_q || last_title AS tq_any, CASE WHEN numnode(phrase_q) > 1 THEN phrase_q ELSE ''::tsquery END AS tq_phrase,
         plainto_tsquery('english', q) AS tq_plain, length(q) - length(replace(q, '★', '')) AS stars, jq FROM i),
primary_type AS (
  SELECT DISTINCT ON (ctm.collectible_id) ctm.collectible_id, ctm.type_id FROM collectible_type_mappings ctm ORDER BY ctm.collectible_id, ctm.type_id),
types AS (
  SELECT ct.id, ct.name AS singular, ct.slug, coalesce(ct.category_group, 'collectibles') AS grp,
         initcap(replace(ct.slug, '-', ' ')) AS title, ct.display_order,
         coalesce((CAST(:type_titles AS jsonb))->>ct.slug, '') AS page_title,
         setweight(to_tsvector('english', initcap(replace(ct.slug, '-', ' ')) || ' ' || ct.name || ' ' || coalesce(ct.category_group, 'collectibles') || ' ' || coalesce((CAST(:type_titles AS jsonb))->>ct.slug, '')), 'C') AS fold
  FROM collectible_types ct),
level_types AS (   -- the types each level holds, so "eidos 7 camps" finds the Eidos 7 page
  SELECT loc.level_id, setweight(to_tsvector('english', string_agg(DISTINCT t.title || ' ' || t.singular, ' ')), 'C') AS f
  FROM collectibles c JOIN collectible_type_mappings m ON m.collectible_id = c.id JOIN types t ON t.id = m.type_id
  JOIN locations loc ON loc.id = c.location_id WHERE (SELECT n_terms FROM qq) >= 2 GROUP BY loc.level_id),
places AS MATERIALIZED (   -- each location's level and location names, folded into its collectibles (once per location)
  SELECT loc.id, lv.display_order * 100000 + loc.display_order * 1000 AS ord,
         setweight(to_tsvector('english', lv.name || ' ' || loc.name), 'C') AS fold
  FROM locations loc JOIN levels lv ON lv.id = loc.level_id),
docs AS (
  -- "|| ''::tsvector" decodes a stored vector once here, not again for every use below
  SELECT 'item' AS kind, c.id, c.title, NULL::text AS singular, c.search_vector || t.fold || pl.fold AS v, 0 AS page,
         pl.ord + c.display_order AS ord, t.grp AS a, t.slug AS b, t.id AS type_id, t.fold AS f
  FROM collectibles c JOIN primary_type pt ON pt.collectible_id = c.id JOIN types t ON t.id = pt.type_id
  JOIN places pl ON pl.id = c.location_id
  UNION ALL SELECT 'walkthrough', w.id, w.title, NULL, w.search_vector || ''::tsvector, 0, w.display_order, w.mission_type, w.slug, NULL, ''::tsvector FROM walkthroughs w
  UNION ALL SELECT 'type', t.id, t.title, t.singular, {_names("t.title || ' ' || t.singular || ' ' || t.page_title || ' ' || t.grp")}, 1, t.display_order, t.grp, t.slug, NULL, ''::tsvector FROM types t
  UNION ALL SELECT 'walkthrough_type', x.ord::int, x.name, NULL, {_names("x.name || ' walkthroughs'")}, 1, x.ord::int, x.slug, x.mtype, NULL, ''::tsvector
    FROM unnest(CAST(:cat_names AS text[]), CAST(:cat_slugs AS text[]), CAST(:cat_types AS text[])) WITH ORDINALITY AS x(name, slug, mtype, ord)
  UNION ALL SELECT 'level', lv.id, lv.name, NULL, {_names("lv.name || ' ' || coalesce((CAST(:level_titles AS jsonb))->>lower(replace(lv.name, ' ', '-')), '')")}, 1, lv.display_order, lower(replace(lv.name, ' ', '-')), NULL, NULL, coalesce(lt.f, ''::tsvector)
    FROM levels lv LEFT JOIN level_types lt ON lt.level_id = lv.id WHERE lower(replace(lv.name, ' ', '-')) = ANY(CAST(:nav_levels AS text[]))),
base0 AS MATERIALIZED (       -- every per-document measure, computed once
  SELECT d.kind, d.id, d.title, d.page, d.ord, d.a, d.b, d.type_id, d.f, ts_filter(d.v, '{{a,b}}') AS vt,
         greatest(similarity(d.title, qq.q), coalesce(similarity(d.singular, qq.q), 0)) AS sim,
         greatest(similarity(replace(lower(d.title), ' ', ''), replace(qq.q, ' ', '')),
                  coalesce(similarity(replace(lower(d.singular), ' ', ''), replace(qq.q, ' ', '')), 0)) AS sim_joined,
         greatest(ts_rank(d.v, qq.tq_body), coalesce(ts_rank(d.v, qq.jq), 0)) AS rk, d.v @@ qq.tq_body OR coalesce(d.v @@ qq.jq, false) AS body_hit, d.v @@ qq.tq_phrase AS phrase,
         (lower(d.title) = qq.q OR lower(coalesce(d.singular, '')) = qq.q) AS exact,
         (qq.stars > 0 AND length(d.title) - length(replace(d.title, '★', '')) = qq.stars) AS star_match,
         -- the item's own words (title, type, place, cycle) hold every query word; tested only on body hits
         d.kind = 'item' AND (d.v @@ qq.tq_body OR coalesce(d.v @@ qq.jq, false))
           AND (ts_filter(d.v, '{{a,b,c}}') @@ qq.tq_body OR coalesce(ts_filter(d.v, '{{a,b,c}}') @@ qq.jq, false)) AS structural
  FROM docs d, qq),
base AS (
  SELECT b.*, b.vt @@ qq.tq_lit AS literal, b.vt @@ qq.tq_any AS title_any,
    (b.exact OR b.vt @@ qq.tq_title OR b.vt @@ qq.tq_plain OR coalesce(b.vt @@ qq.jq, false)) AS title_all,
    -- every word in the title plus the doc's type names, at least one in the title ("memorystick legionnaire 511's prayer")
    (b.f <> ''::tsvector AND qq.n_terms >= 2 AND b.vt @@ qq.tq_any
     AND ((b.vt || b.f) @@ qq.tq_title OR coalesce((b.vt || b.f) @@ qq.jq, false))) AS fold_all,
    (b.sim >= 0.45 OR b.sim_joined >= 0.6) AS t3,
    b.body_hit AND (b.kind <> 'walkthrough' OR qq.n_terms <= 1 OR b.phrase OR b.rk >= 0.01) AS t2
  FROM base0 b, qq),
hits AS (SELECT bool_or(title_all OR fold_all OR t2) AS strict, bool_or(t3) AS near FROM base),
tiered AS (
  SELECT b.*, CASE WHEN b.title_all OR b.fold_all THEN 4
      WHEN b.t3 AND (NOT h.strict OR greatest(b.sim, b.sim_joined) >= 0.8) THEN 3
      WHEN b.t2 THEN 2
      WHEN b.t3 THEN 1
      WHEN NOT (h.strict OR h.near) AND b.vt @@ qq.tq_any THEN 1 END AS t
  FROM base b, hits h, qq),
top AS (
  SELECT *, t + CASE t
      WHEN 4 THEN 0.30 * exact::int + 0.25 * literal::int + 0.20 * page + 0.15 * sim + 0.09 * rk / (1 + rk) + 0.05 * star_match::int - 0.30 * (NOT title_all)::int
      WHEN 3 THEN 0.85 * greatest(sim, sim_joined) + 0.10 * page + 0.05 * star_match::int
      WHEN 2 THEN least(0.99, 0.40 * phrase::int + 0.25 * structural::int + 0.20 * title_any::int + 0.35 * rk / (1 + rk))
      WHEN 1 THEN 0.50 * greatest(sim, sim_joined) + 0.30 * page + 0.05 * star_match::int END AS score
  FROM tiered WHERE t IS NOT NULL ORDER BY score DESC, page DESC, ord, id LIMIT :limit),
results AS (
  SELECT 0 AS part, top.kind, top.id, top.title, top.a, top.b, top.type_id, top.t AS tier, top.score,
    c.description, c.cycle, ty.singular AS type_name, lv2.name AS level_name, loc2.name AS location_name, w.subtitle, w.available_after,
    CASE WHEN top.t = 2 THEN w.content END AS content,
    CASE WHEN top.t = 2 THEN (CASE WHEN jsonb_typeof(w.objectives) = 'array' THEN w.objectives ELSE '[]'::jsonb END)
                          || (CASE WHEN jsonb_typeof(w.rewards) = 'array' THEN w.rewards ELSE '[]'::jsonb END) END AS extra,
    CASE top.kind
      WHEN 'type' THEN (SELECT coalesce(sum(coalesce(c2.quantity, 1)), 0) FROM collectible_type_mappings m JOIN collectibles c2 ON c2.id = m.collectible_id WHERE m.type_id = top.id)
      WHEN 'walkthrough_type' THEN (SELECT count(*) FROM walkthroughs w2 WHERE w2.mission_type = top.b)
      WHEN 'level' THEN (SELECT coalesce(sum(coalesce(c2.quantity, 1)), 0) FROM locations l2 JOIN collectibles c2 ON c2.location_id = l2.id WHERE l2.level_id = top.id)
    END AS n,
    top.score AS k1, top.page AS k2, top.ord AS k3
  FROM top
  LEFT JOIN collectibles c ON top.kind = 'item' AND c.id = top.id
  LEFT JOIN types ty ON top.kind = 'item' AND ty.id = top.type_id
  LEFT JOIN locations loc2 ON loc2.id = c.location_id LEFT JOIN levels lv2 ON lv2.id = loc2.level_id
  LEFT JOIN walkthroughs w ON top.kind = 'walkthrough' AND w.id = top.id)
SELECT *, CASE WHEN part = 0 THEN (SELECT json_agg(json_build_array(x, tsvector_to_array(to_tsvector('english', x)))) FROM unnest(CAST(:plain AS text[])) x) END AS stems
FROM (
  SELECT * FROM results
  UNION ALL
  -- each matched collectible type's full title list in page order, for the anchor suffixes (_build_slug_map).
  -- The keys sort as k1 DESC, k2 DESC, k3: type and level negated, location and item not.
  SELECT 1, 'slug', c.id, c.title, NULL, NULL, ctm.type_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
         -ctm.type_id, -lv.display_order, loc.display_order * 100000 + c.display_order
  FROM collectible_type_mappings ctm JOIN collectibles c ON c.id = ctm.collectible_id
  JOIN locations loc ON c.location_id = loc.id JOIN levels lv ON loc.level_id = lv.id
  WHERE ctm.type_id IN (SELECT type_id FROM top WHERE kind = 'item')
) u
ORDER BY part, k1 DESC, k2 DESC, k3, id
""")


def _search_params(q: str, parsed: dict, limit: int) -> dict:
    return dict(
        q=q, limit=limit, all_q=parsed["all_q"], any_q=parsed["any_q"], lit_q=parsed["lit_q"],
        phrase_q=parsed["phrase_q"], last=parsed["last"], n_terms=parsed["n_terms"], joined=parsed["joined"],
        all_j=parsed["all_j"], plain=parsed["plain"], cat_names=_CATEGORY_NAMES, cat_slugs=_CATEGORY_SLUGS,
        cat_types=_CATEGORY_TYPES, nav_levels=sorted(NAV_LEVEL_SLUGS), type_titles=_TYPE_TITLES,
        level_titles=_LEVEL_TITLES,
    )


# ---------------------------------------------------------------------------
# Typo fallback
# ---------------------------------------------------------------------------

# Every word a title or name holds, including the hidden levels' ("challenge").
_VOCAB_SQL = text("""
    SELECT title FROM collectibles UNION SELECT title FROM walkthroughs UNION SELECT name FROM levels
    UNION SELECT initcap(replace(slug, '-', ' ')) FROM collectible_types UNION SELECT name FROM collectible_types
    UNION SELECT unnest(CAST(:cat_names AS text[]))
""")


def _vocab_params() -> dict:
    return {"cat_names": _CATEGORY_NAMES}


def _osa(a: str, b: str, k: int) -> int:
    """Optimal string alignment distance (Levenshtein, with a swap of two neighbouring
    letters counting as one edit). Past k it stops early and returns some number above k."""
    if abs(len(a) - len(b)) > k:
        return k + 1
    prev2, prev = None, list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        cur = [i] + [0] * len(b)
        for j in range(1, len(b) + 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] != b[j - 1]))
            if prev2 is not None and i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                cur[j] = min(cur[j], prev2[j - 2] + 1)
        if min(cur) > k:
            return k + 1
        prev2, prev = prev, cur
    return prev[-1]


def _max_edits(length: int, words: int) -> int:
    """Edits allowed in a word: none up to 4 letters, 1 up to 7, 2 for 8-9 (3 when
    another word must agree), 3 from 10."""
    return 0 if length <= 4 else 1 if length <= 7 else 3 if (length >= 10 or words >= 2) else 2


async def _correct(db: AsyncSession, q: str) -> str | None:
    """The query with its misspelt words replaced by title words, if the corrected
    words appear together in one title; else None. 1-4 words, one of 5+ letters."""
    toks = re.findall(r"[^\W_]+", q)
    if not toks or len(toks) > 4 or all(t.isdigit() or _max_edits(len(t), len(toks)) == 0 for t in toks):
        return None
    postings = defaultdict(set)
    for i, (title,) in enumerate((await db.execute(_VOCAB_SQL, _vocab_params())).all()):
        for word in set(re.findall(r"[^\W_]+", title.lower())):
            postings[word].add(i)
    options, changed = [], False
    for t in toks:
        k = _max_edits(len(t), len(toks))
        if t in postings or t.isdigit() or k == 0:
            options.append([t])
            continue
        scored = sorted((d, v) for v in postings if (d := _osa(t, v, k)) <= k)
        best = [v for d, v in scored if d == scored[0][0]] if scored else []
        options.append(best or [t])
        changed |= bool(best)
    if not changed:
        return None
    for combo in itertools.islice(itertools.product(*options), 256):
        if all(w in postings for w in combo) and set.intersection(*(postings[w] for w in combo)):
            return " ".join(combo)
    return None


# ---------------------------------------------------------------------------
# Links and snippets
# ---------------------------------------------------------------------------

def _slugify_title(title: str) -> str:
    # Byte-for-byte mirror of slugifyTitle in client/src/utils/slugify.ts: anchors
    # built here must match client DOM ids. The Greek range Ͱ-Ͽ is load-bearing
    # for titles with Greek characters — not dead code.
    title = title.lower()
    title = re.sub(r"★+", lambda m: f" {len(m.group())} ", title)
    title = re.sub(r"'", "", title)
    title = re.sub(r"[^a-z0-9Ͱ-Ͽ]+", "-", title)
    return title.strip("-")


def _build_slug_map(collectibles: list[tuple[int, str]]) -> dict[int, str]:
    """Server mirror of client buildSlugMap (slugify.ts): collectibles sharing a
    base slug get positional -1/-2 suffixes in the given order; unique slugs stay
    bare. `collectibles` must be ordered exactly as the type page flattens them
    (level -> location -> collectible display_order)."""
    counts: dict[str, int] = {}
    for _id, title in collectibles:
        base = _slugify_title(title)
        counts[base] = counts.get(base, 0) + 1
    used: dict[str, int] = {}
    out: dict[int, str] = {}
    for _id, title in collectibles:
        base = _slugify_title(title)
        if counts[base] > 1:
            used[base] = used.get(base, 0) + 1
            out[_id] = f"{base}-{used[base]}"
        else:
            out[_id] = base
    return out


def _section_anchor(block: dict) -> str | None:
    """Mirror of the walkthrough page's section ids (sectionAnchor in
    client/src/utils/slugify.ts): a titled section's slug, an untitled one's
    section-{order}. None when a title slugifies to nothing: no id to land on."""
    title = block.get("section_title")
    if isinstance(title, str) and title:
        return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", title.lower().replace("'", ""))) or None
    order = block.get("order")
    if order is None:
        return None
    return f"section-{str(order).lower() if isinstance(order, bool) else order}"


def _extract_snippet(description: dict | None) -> str | None:
    if not description:
        return None
    text_content = description.get("content")
    if text_content:
        cleaned = _strip_links(text_content)
        return (cleaned[:120] + '...') if len(cleaned) > 120 else cleaned
    items = description.get("items")
    if items:
        cleaned = _strip_links(items[0])
        return (cleaned[:120] + '...') if len(cleaned) > 120 else cleaned
    return None


VISIBLE = 44   # snippet characters the narrowest results row shows (desktop panel w-88, text-xs)


def _match_rx(terms) -> re.Pattern | None:
    terms = sorted({t for t in terms if len(t) >= 2}, key=len, reverse=True)
    if not terms:
        return None
    return re.compile(r"(?<![^\W_])(?:" + "|".join(re.escape(t).replace(r"\ ", r"\s+") for t in terms) + r")", re.I)


def _fragment(text: str | None, rxs: list, room: int) -> str | None:
    """A window of `text` whose first match starts within `room` characters; typed
    words win over alias words. Near the end, it shows what leads up to the match."""
    text = " ".join((text or "").split())
    m = next((x for x in (rx.search(text) for rx in rxs if rx) if x), None) if text else None
    if not m:
        return None
    start = text.rfind(" ", 0, m.start()) + 1 if m.start() else 0
    prev = text.rfind(" ", 0, max(0, start - 1))
    if start > 0 and start - prev <= room // 3:  # keep one word of lead-in when it fits
        start = prev + 1
    if len(text) - start < room:                 # near the end: show what leads up to it
        start = max(0, len(text) - room)
        start = 0 if start == 0 else text.find(" ", start) + 1
    return ("…" if start > 0 else "") + text[start:start + 160].rstrip()


def _walkthrough_body_snippet(row, rxs) -> tuple[str | None, str | None]:
    """(anchor, snippet) for a walkthrough found in its body: the section matching the
    most distinct query words, as "Section title: fragment"; else a matching objective
    or reward, else a matching available_after, else the subtitle."""
    blocks = [b for b in row["content"] if isinstance(b, dict)] if isinstance(row["content"], list) else []
    best, best_score = None, 0
    for b in blocks:
        title = b.get("section_title") if isinstance(b.get("section_title"), str) else ""
        found = {m.group(0).lower() for rx in rxs if rx for m in rx.finditer(f"{title} {section_text(b)}")}
        if len(found) > best_score:
            best, best_score = b, len(found)
    if best is not None:
        label = best.get("section_title") if isinstance(best.get("section_title"), str) else ""
        if label and VISIBLE - len(label) - 3 < 12:
            label = label[:VISIBLE - 16].rstrip() + "…"
        body = section_text(best)
        frag = _fragment(body, rxs, VISIBLE - len(label) - 2 if label else VISIBLE) or " ".join(body.split())[:120]
        return _section_anchor(best), (f"{label}: {frag}" if label else frag)
    frag = _fragment(" · ".join(_strip_links(x) for x in list_strings(row["extra"])), rxs, VISIBLE)
    if frag:
        return None, frag
    after = _strip_links(row["available_after"] or "")
    if any(rx and rx.search(after) for rx in rxs):
        return None, after
    return None, row["subtitle"]


def _item_body_snippet(row, rxs) -> str:
    """A collectible found beyond its title: the matching description fragment, else
    its type, the place a query word matched and a non-base cycle, then the usual
    description start ("Passcode · Eidos 7 · Beside the locked gate…")."""
    description = " · ".join(_strip_links(s) for s in description_strings(row["description"]))
    frag = _fragment(description, rxs, VISIBLE)
    if frag:
        return frag
    place = next((p for p in (row["location_name"], row["level_name"])
                  if p and any(rx and rx.search(p) for rx in rxs)), None)
    cycle = row["cycle"] if row["cycle"] and row["cycle"] not in BASE_CYCLES else None
    tag = " · ".join(x for x in (row["type_name"], place, cycle) if x)
    return f"{tag} · {_extract_snippet(row['description']) or ''}".rstrip(" ·")


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

async def _execute_search(db: AsyncSession, q: str, limit: int) -> tuple[list[SearchResult], str | None]:
    """(results, corrected) for a normalized query; `corrected` is the typo-corrected
    query the results are for, or None. One statement, plus the vocabulary query and a
    second statement on the typo path. A failing statement raises, so a broken search
    answers 500 and is never cached as an empty result."""
    if not q or not q.isprintable():
        return [], None
    parsed = build_query(q)
    if parsed["empty"]:
        return [], None
    rows = (await db.execute(_SEARCH_SQL, _search_params(q, parsed, limit))).mappings().all()
    found = [r for r in rows if r["part"] == 0]
    corrected = None
    if all(r["tier"] == 1 for r in found):   # nothing held every word, or nothing matched at all
        alt = await _correct(db, q)
        if alt and alt != q:
            alt_parsed = build_query(alt)
            alt_rows = (await db.execute(_SEARCH_SQL, _search_params(alt, alt_parsed, limit))).mappings().all()
            alt_found = [r for r in alt_rows if r["part"] == 0]
            if alt_found and not all(r["tier"] == 1 for r in alt_found):
                rows, found, corrected, parsed = alt_rows, alt_found, alt, alt_parsed

    # Words for highlighting: what was typed plus its stems; alias words only as a fallback.
    kept = [x for w, stems in (found[0]["stems"] or []) if stems for x in [w] + stems] if found else []
    rxs = [_match_rx(kept), _match_rx(parsed["concept_words"])]
    lists = defaultdict(list)
    for r in rows:
        if r["part"] == 1:
            lists[r["type_id"]].append((r["id"], r["title"]))
    slug_maps = {type_id: _build_slug_map(items) for type_id, items in lists.items()}

    results = []
    for r in found:
        kind = r["kind"]
        if kind == "item":
            anchor = slug_maps.get(r["type_id"], {}).get(r["id"]) or _slugify_title(r["title"])
            url = f"/{r['a']}/{r['b']}#{anchor}"
            snippet = _item_body_snippet(r, rxs) if r["tier"] == 2 else _extract_snippet(r["description"])
            kind = r["a"]
        elif kind == "walkthrough":
            url = f"/walkthroughs/{url_type(r['a'])}/{r['b']}"
            snippet = r["subtitle"]
            if r["tier"] == 2:
                anchor, snippet = _walkthrough_body_snippet(r, rxs)
                if anchor:
                    url += f"#{anchor}"
        elif kind == "type":
            url, snippet = f"/{r['a']}/{r['b']}", f"{r['n']} {r['title'].lower()}"
        elif kind == "walkthrough_type":
            url, snippet = f"/walkthroughs/{r['a']}", f"{r['n']} walkthrough{'s' if r['n'] != 1 else ''}"
        else:
            url, snippet = f"/levels/{r['a']}", f"{r['n']} collectible{'s' if r['n'] != 1 else ''}"
        results.append(SearchResult(kind=kind, id=r["id"], title=r["title"], snippet=snippet,
                                    navigation_url=url, score=float(r["score"])))
    return results, corrected
