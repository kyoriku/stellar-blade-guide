// Mirrors the server-side username rule (`username_valid` in
// server/app/schemas/users.py, duplicated in server/app/schemas/auth.py): 3–50 characters,
// only letters / numbers / hyphens / underscores, with at least one alphanumeric.
//
// Uses Unicode property escapes (\p{L}, \p{N}) to match Python's str.isalnum(),
// which accepts non-ASCII letters and digits — a plain [a-zA-Z0-9] check would
// wrongly reject valid names like "José" or "你好". Keep in sync with the server
// validators; the server remains the final authority.
const USERNAME_CHARS = /^[\p{L}\p{N}_-]+$/u;
const HAS_ALNUM = /[\p{L}\p{N}]/u;

export const USERNAME_RULE = 'Letters, numbers, hyphens and underscores only. 3–50 characters.';

export function isValidUsername(name: string): boolean {
  const trimmed = name.trim();
  return (
    trimmed.length >= 3 &&
    trimmed.length <= 50 &&
    USERNAME_CHARS.test(trimmed) &&
    HAS_ALNUM.test(trimmed)
  );
}
