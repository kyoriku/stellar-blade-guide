import { describe, it, expect } from 'vitest'
import { hashTarget } from './hashTarget'

// A Greek passcode's slug, as a link holds it and as the router reads it back.
const GREEK = '\u03b3\u03b8\u03b1\u03b3\u03b8\u03b1'
const GREEK_ENCODED = '%CE%B3%CE%B8%CE%B1%CE%B3%CE%B8%CE%B1'

describe('hashTarget', () => {
  it('names nothing without a hash', () => {
    expect(hashTarget('')).toBeNull()
    expect(hashTarget('#')).toBeNull()
  })

  it('gives the id after the #', () => {
    expect(hashTarget('#red-passion')).toBe('red-passion')
    expect(hashTarget('#eidos-company-promotion-2')).toBe('eidos-company-promotion-2')
    expect(hashTarget('#comment-12')).toBe('comment-12')
    expect(hashTarget('#a+b')).toBe('a+b')
  })

  it('decodes a percent-encoded hash', () => {
    expect(hashTarget(`#${GREEK_ENCODED}`)).toBe(GREEK)
    expect(hashTarget('#all-a%E2%80%93z')).toBe('all-a\u2013z')
    expect(hashTarget('#100%25')).toBe('100%')
  })

  it('leaves a hash that holds its text as it is', () => {
    expect(hashTarget(`#${GREEK}`)).toBe(GREEK)
  })

  it('names nothing for a hash that does not decode, rather than throwing', () => {
    // Cut short, bad hex, a lone surrogate and an overlong form: none is valid UTF-8 text.
    for (const hash of ['#%', '#100%', '#%E0', '#%CE', '#%CE%B1%CE', '#a%E0%A4%A', '#a%zz', '#%ED%A0%80', '#%C0%AF']) {
      expect(hashTarget(hash), hash).toBeNull()
    }
  })
})
