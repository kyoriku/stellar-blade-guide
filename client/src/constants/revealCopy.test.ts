import { describe, expect, it } from 'vitest'
import { REVEAL_COPY } from './revealCopy'

describe('REVEAL_COPY.shown', () => {
  it('names the card, ending on one full stop', () => {
    expect(REVEAL_COPY.shown('Red Passion')).toBe('Filter set to All to show Red Passion.')
  })

  it('adds no full stop after a title that ends a sentence itself', () => {
    expect(REVEAL_COPY.shown('Welcome to the Raphael Space Center!')).toBe('Filter set to All to show Welcome to the Raphael Space Center!')
    expect(REVEAL_COPY.shown('Who Are You Guys?')).toBe('Filter set to All to show Who Are You Guys?')
  })
})
