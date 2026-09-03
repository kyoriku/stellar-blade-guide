import { describe, it, expect } from 'vitest'
import { LEVELS } from './navigation'
import { LEVEL_SEO, isLevelSlug } from './levelSeo'

// The level titles and descriptions are hand-written copy with hardcoded
// counts (the dataset is complete, so the numbers are static). These tests pin
// the copy contract: count-led title shape, tab-title length, no deictic words
// (each description doubles as the meta/og description), and the title's count
// restated as the first numeral of the description — so a count correction
// cannot change one without the other. The e2e level-seo spec pins the same
// numbers against the live count line.

describe('LEVEL_SEO', () => {
  it('covers every level slug with non-empty copy', () => {
    for (const { slug } of LEVELS) {
      const entry = LEVEL_SEO[slug]
      expect(entry.title.length).toBeGreaterThan(0)
      expect(entry.description.length).toBeGreaterThan(0)
    }
  })

  it('titles are count-led, with Nest as the single-collectible fallback', () => {
    for (const { slug } of LEVELS) {
      const { title } = LEVEL_SEO[slug]
      if (slug === 'nest') {
        expect(title).toBe('Nest Collectibles')
      } else {
        expect(title).toMatch(/^All \d+ .+ Collectibles$/)
      }
    }
  })

  it('keeps titles within 38 chars so the suffixed tab title stays within 60', () => {
    for (const { slug } of LEVELS) {
      expect(LEVEL_SEO[slug].title.length).toBeLessThanOrEqual(38)
    }
  })

  it('bans deictic "below" and "here" from descriptions', () => {
    for (const { slug } of LEVELS) {
      expect(LEVEL_SEO[slug].description).not.toMatch(/\b(below|here)\b/i)
    }
  })

  it('restates the title count as the first number of the description', () => {
    for (const { slug, name } of LEVELS) {
      if (slug === 'nest') continue // no number in the Nest title
      const { title, description } = LEVEL_SEO[slug]
      const titleCount = title.match(/\d+/)?.[0]
      // Strip the display name first — Eidos 7, Matrix 11, Spire 4, and
      // Eidos 9 carry digits of their own.
      const firstNumber = description.split(name).join('').match(/\d+/)?.[0]
      expect(firstNumber).toBe(titleCount)
    }
  })
})

describe('isLevelSlug', () => {
  it('accepts every navigation level slug', () => {
    for (const { slug } of LEVELS) {
      expect(isLevelSlug(slug)).toBe(true)
    }
  })

  it('rejects values that are not level slugs', () => {
    expect(isLevelSlug('default')).toBe(false)
    expect(isLevelSlug('Great Desert')).toBe(false)
    expect(isLevelSlug('')).toBe(false)
  })
})
