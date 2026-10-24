/**
 * The server's two password limits, mirrored from server/app/core/passwords.py
 * (server/tests/test_passwords.py reads this file to keep them in step). A new password
 * stops at 128. One checked against a stored hash, at sign-in or as the current password
 * in Settings, stops at passlib's 4096, which no stored password exceeds, so that check
 * never refuses a password that works.
 */
export const NEW_PASSWORD_MAX_LENGTH = 128
export const CURRENT_PASSWORD_MAX_LENGTH = 4096

// The server's 422 detail, word for word.
const tooLong = (max: number) => `Password must be at most ${max} characters`
export const NEW_PASSWORD_TOO_LONG = tooLong(NEW_PASSWORD_MAX_LENGTH)
export const CURRENT_PASSWORD_TOO_LONG = tooLong(CURRENT_PASSWORD_MAX_LENGTH)

/**
 * True when the password is over `max` characters, counted as the server counts them:
 * code points, as [...s] gives. .length counts UTF-16 units, two for an emoji.
 */
export function passwordTooLong(password: string, max: number): boolean {
  return [...password].length > max
}
