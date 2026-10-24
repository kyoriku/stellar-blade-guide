import { describe, it, expect } from 'vitest'
import {
  CURRENT_PASSWORD_MAX_LENGTH,
  CURRENT_PASSWORD_TOO_LONG,
  NEW_PASSWORD_MAX_LENGTH,
  NEW_PASSWORD_TOO_LONG,
  passwordTooLong,
} from './validatePassword'

// Mirrors server/app/core/passwords.py, whose tests read the constants and the message
// template from this module's source.
const EMOJI = String.fromCodePoint(0x1f600) // one character to the server, two UTF-16 units here
const SURROGATE = String.fromCharCode(0xd800) // half a pair; Python counts it as one too

describe.each([
  ['a new password', NEW_PASSWORD_MAX_LENGTH],
  ['a current password', CURRENT_PASSWORD_MAX_LENGTH],
])('passwordTooLong for %s', (_, max) => {
  it('allows the limit and refuses one more and far more', () => {
    expect(passwordTooLong('p'.repeat(max), max)).toBe(false)
    expect(passwordTooLong('p'.repeat(max + 1), max)).toBe(true)
    expect(passwordTooLong('p'.repeat(1_000_000), max)).toBe(true)
  })

  it('counts characters as the server does, not UTF-16 units', () => {
    expect(EMOJI.repeat(max).length).toBe(2 * max)
    expect(passwordTooLong(EMOJI.repeat(max), max)).toBe(false)
    expect(passwordTooLong(EMOJI.repeat(max + 1), max)).toBe(true)
  })

  it('counts a lone surrogate as one character', () => {
    expect(passwordTooLong(SURROGATE.repeat(max), max)).toBe(false)
    expect(passwordTooLong(SURROGATE.repeat(max + 1), max)).toBe(true)
  })

  it('has no minimum of its own', () => {
    expect(passwordTooLong('', max)).toBe(false)
  })
})

describe('the limits and their messages', () => {
  it('are the server values, word for word', () => {
    expect(NEW_PASSWORD_MAX_LENGTH).toBe(128)
    expect(CURRENT_PASSWORD_MAX_LENGTH).toBe(4096)
    expect(NEW_PASSWORD_TOO_LONG).toBe('Password must be at most 128 characters')
    expect(CURRENT_PASSWORD_TOO_LONG).toBe('Password must be at most 4096 characters')
  })
})
