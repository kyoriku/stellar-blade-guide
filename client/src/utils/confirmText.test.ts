import { describe, it, expect } from 'vitest'
import { confirmTextMatches } from './confirmText'

describe('confirmTextMatches', () => {
  it('matches the exact text', () => {
    expect(confirmTextMatches('spam_account', 'spam_account')).toBe(true)
  })

  it('refuses a different case', () => {
    expect(confirmTextMatches('Spam_account', 'spam_account')).toBe(false)
    expect(confirmTextMatches('SPAM_ACCOUNT', 'spam_account')).toBe(false)
  })

  it('refuses a partial or a longer text', () => {
    expect(confirmTextMatches('spam_acc', 'spam_account')).toBe(false)
    expect(confirmTextMatches('spam_account2', 'spam_account')).toBe(false)
    expect(confirmTextMatches('spam account', 'spam_account')).toBe(false)
  })

  it('matches NFD typing against an NFC name, and the other way round', () => {
    const composed = 'Jos\u00e9'
    const decomposed = 'Jose\u0301'
    expect(composed).not.toBe(decomposed)
    expect(confirmTextMatches(decomposed, composed)).toBe(true)
    expect(confirmTextMatches(composed, decomposed)).toBe(true)
  })

  it('ignores spaces at either end, and only there', () => {
    expect(confirmTextMatches('  spam_account', 'spam_account')).toBe(true)
    expect(confirmTextMatches('spam_account  ', 'spam_account')).toBe(true)
    expect(confirmTextMatches('\tspam_account\n', 'spam_account')).toBe(true)
    expect(confirmTextMatches('spam _account', 'spam_account')).toBe(false)
  })

  it('trims the expected text too', () => {
    expect(confirmTextMatches('spam_account', ' spam_account ')).toBe(true)
  })

  it('never matches an empty text', () => {
    expect(confirmTextMatches('', 'spam_account')).toBe(false)
    expect(confirmTextMatches('   ', 'spam_account')).toBe(false)
    expect(confirmTextMatches('', '')).toBe(false)
  })
})
