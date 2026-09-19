"""
The username rule and the provider-name cleaner (app/core/usernames.py).

Registration and Settings validate what a person typed. A provider login has nobody to
ask, so the OAuth create step cleans the provider's display name into the rule and then
checks it with the rule. Before that, the create step stored the name unchecked: a
Google display name of "kyoriku" followed by a zero-width space was a different string
from "kyoriku", passed the uniqueness check, and rendered exactly like it.

Pure functions, so no app, no database and no Redis here.
"""
import re
import unicodedata

import pytest

from app.core.usernames import GENERATED_BASE_MAX, username_from_provider, username_problem

ZWSP = "\u200b"          # zero-width space
RLO = "\u202e"           # right-to-left override
NBSP = "\u00a0"          # non-breaking space

# Every unusual character in this file is an escape, on purpose. The file stays plain
# ASCII, so an editor's warning about an invisible or look-alike character means
# something if it ever fires here: a literal zero-width space in a test about zero-width
# spaces is exactly the kind of thing nobody can review. What the escapes are (written
# without their backslash, so none of this is an escape itself):
#   u00e9 u00ed u00c4           e-acute, i-acute, A-umlaut: ordinary accented letters
#   u0301                       a combining acute accent on its own
#   u4f60 u597d u4e16 u754c     Chinese text
#   u674e u96f7                 a two-character Chinese name
#   uff4b uff59 uff4f ...       full-width Latin letters spelling "kyoriku"
#   U0001d424 U0001d432 ...     mathematical bold letters, the start of "kyoriku"
#   U0001f3ae                   a game-controller emoji
#   u2066 u2069 ufeff u00ad     bidi isolates, a byte-order mark, a soft hyphen: invisible
#   u2000-u2003 u3000           Unicode spaces of assorted widths
#   u2028 u2029                 line and paragraph separators
#   ud800 udfff                 lone surrogates

GENERATED = re.compile(r"^user_[0-9a-f]{6}$")


# ── the rule ─────────────────────────────────────────────────────────────────

def test_the_two_messages_are_unchanged():
    """They are the 422 detail the client shows, so they are a contract."""
    assert username_problem("ab") == "Username must be between 3 and 50 characters"
    assert username_problem("a" * 51) == "Username must be between 3 and 50 characters"
    assert username_problem("bad name") == "Username may only contain letters, numbers, hyphens, and underscores"
    assert username_problem("___") == "Username may only contain letters, numbers, hyphens, and underscores"


@pytest.mark.parametrize("name", ["abc", "a" * 50, "Jean-Luc", "snake_case_1", "Jos\u00e9", "\u4f60\u597d\u4e16\u754c", "\u00c4rger"])
def test_valid_names_including_non_ascii_letters(name):
    """The rule is not ASCII-only: str.isalnum() accepts any Unicode letter or digit,
    and the client mirrors that with \\p{L}\\p{N}."""
    assert username_problem(name) is None


@pytest.mark.parametrize("name", [f"kyoriku{ZWSP}", f"ky{RLO}oriku", f"admin{NBSP}", "john.doe", "O'Brien", "\U0001f3aeGamer\U0001f3ae"])
def test_the_rule_rejects_what_the_oauth_path_used_to_store(name):
    assert username_problem(name) is not None


# ── the cleaner: exact outputs ───────────────────────────────────────────────

@pytest.mark.parametrize(
    ("provider_name", "stored"),
    [
        # Unchanged from what was stored before, so nothing moves for ordinary names.
        ("OAuth User", "OAuth_User"),
        ("oauthuser", "oauthuser"),
        ("Jos\u00e9 Garc\u00eda", "Jos\u00e9_Garc\u00eda"),
        ("Jean-Luc", "Jean-Luc"),
        # The invisible duplicate becomes the plain name, which then collides with the
        # existing user and takes a visible suffix in the create step.
        (f"kyoriku{ZWSP}", "kyoriku"),
        (f"admin{NBSP}", "admin"),
        # Forbidden characters become separators rather than vanishing.
        (f"ky{RLO}oriku", "ky_oriku"),
        ("john.doe", "john_doe"),
        ("O'Brien", "O_Brien"),
        ("x\ty\nz", "x_y_z"),
        ("  spaced   out  ", "spaced_out"),
        ("\U0001f3aeGamer\U0001f3ae", "Gamer"),
        # NFKC: a styled copy of a name folds to the name itself.
        ("\uff4b\uff59\uff4f\uff52\uff49\uff4b\uff55", "kyoriku"),
        ("\U0001d424\U0001d432\U0001d428riku", "kyoriku"),
        # NFKC also composes, so a decomposed accent becomes a letter isalnum() accepts.
        ("Jose\u0301", "Jos\u00e9"),
    ],
)
def test_provider_name_to_stored_name(provider_name, stored):
    assert username_from_provider(provider_name) == stored


def test_long_names_are_cut_so_the_uniqueness_suffix_always_fits():
    out = username_from_provider("a" * 80)
    assert out == "a" * GENERATED_BASE_MAX
    assert username_problem(out + "99999") is None


def test_a_cut_never_leaves_a_separator_on_the_end():
    out = username_from_provider("a" * (GENERATED_BASE_MAX - 1) + " tail")
    assert out == "a" * (GENERATED_BASE_MAX - 1)


# ── the cleaner: generated shapes ────────────────────────────────────────────

@pytest.mark.parametrize("provider_name", ["\u674e\u96f7", "ab", "x"])
def test_a_real_short_name_keeps_its_characters(provider_name):
    out = username_from_provider(provider_name)
    assert re.fullmatch(re.escape(provider_name) + r"_[0-9a-f]{6}", out)
    assert username_problem(out) is None


@pytest.mark.parametrize("provider_name", [None, "", "   ", "\U0001f3ae\U0001f3ae", "___", "-_-", ZWSP, "...", "'"])
def test_nothing_usable_gives_a_generated_name(provider_name):
    assert GENERATED.match(username_from_provider(provider_name))


def test_generated_names_are_not_all_the_same():
    assert len({username_from_provider(None) for _ in range(20)}) > 1


# ── the rule has the last word ───────────────────────────────────────────────

HOSTILE = [
    f"kyoriku{ZWSP}", f"{ZWSP}{ZWSP}{ZWSP}", f"a{RLO}b{RLO}c", "\x00\x01\x02abc", "abc\x7f",
    "\u2066admin\u2069", "\ufeffadmin", "ad\u00admin", "a\u0301\u0301\u0301\u0301",
    "\u0301\u0301\u0301", " \u2000\u2001\u2002\u2003\u3000 name \u2028\u2029",
    "<script>alert(1)</script>", "../../etc/passwd", "'; DROP TABLE users; --",
    "x" * 500, "\U0001f3ae" * 100, "a-" * 60, "_-" * 60,
    # json.loads turns a "\ud800" escape into a lone surrogate, which would otherwise
    # reach the database driver and fail to encode.
    "\ud800abc", "abc\udfff", "\ud800",
]


@pytest.mark.parametrize("provider_name", HOSTILE, ids=range(len(HOSTILE)))
def test_whatever_comes_in_what_goes_out_satisfies_the_rule(provider_name):
    out = username_from_provider(provider_name)
    assert username_problem(out) is None
    assert len(out) <= GENERATED_BASE_MAX
    # Format, control, space, combining-mark and surrogate characters: none survive.
    assert not {unicodedata.category(ch) for ch in out} & {"Cf", "Cc", "Zs", "Zl", "Zp", "Mn", "Cs"}
    assert out == out.strip("_-")
