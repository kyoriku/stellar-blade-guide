import { describe, it, expect } from 'vitest'
import { isValidUsername } from './validateUsername'

// Mirrors the server-side rule (username_valid in server/app/schemas/users.py):
// 3–50 chars, letters/numbers/hyphens/underscores, at least one alphanumeric.

describe('isValidUsername', () => {
  it('accepts simple names', () => {
    expect(isValidUsername('kyoriku')).toBe(true)
    expect(isValidUsername('a_b-c1')).toBe(true)
  })

  it('accepts non-ASCII letters like Python str.isalnum does', () => {
    expect(isValidUsername('José')).toBe(true)
  })

  it('enforces the 3–50 length bounds after trimming', () => {
    expect(isValidUsername('ab')).toBe(false)
    expect(isValidUsername('abc')).toBe(true)
    expect(isValidUsername('x'.repeat(50))).toBe(true)
    expect(isValidUsername('x'.repeat(51))).toBe(false)
    expect(isValidUsername('  ab  ')).toBe(false)
  })

  it('rejects disallowed characters', () => {
    expect(isValidUsername('has space')).toBe(false)
    expect(isValidUsername('semi;colon')).toBe(false)
  })

  it('rejects names with no alphanumeric character', () => {
    expect(isValidUsername('---')).toBe(false)
    expect(isValidUsername('___')).toBe(false)
  })
})
