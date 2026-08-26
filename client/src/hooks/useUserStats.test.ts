import { describe, it, expect } from 'vitest'
import { weightedFound } from './useUserStats'

// weightedFound is the live ring/hero numerator: set size plus (qty − 1) for
// each checked multi-quantity entry. The overrides map arrives from JSON, so
// its keys are strings — that conversion is part of the contract.

describe('weightedFound', () => {
  it('equals the set size with no overrides', () => {
    expect(weightedFound(new Set([1, 2, 3]), {})).toBe(3)
  })

  it('credits a checked ×N entry N', () => {
    expect(weightedFound(new Set([833]), { '833': 5 })).toBe(5)
  })

  it('ignores unchecked overrides', () => {
    expect(weightedFound(new Set([1]), { '833': 5 })).toBe(1)
  })

  it('mixes plain and weighted entries', () => {
    // 3 plain + one ×2 checked = 3 + 1 + (2 − 1)
    expect(weightedFound(new Set([1, 2, 3, 184]), { '184': 2, '833': 5 })).toBe(5)
  })

  it('handles the empty set', () => {
    expect(weightedFound(new Set(), { '833': 5 })).toBe(0)
  })
})
