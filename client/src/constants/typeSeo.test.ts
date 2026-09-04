import { describe, it, expect } from 'vitest'
import { COLLECTIBLES, UPGRADES, COSMETICS, MATERIALS } from './navigation'
import { TYPE_SEO, isTypeSlug } from './typeSeo'
import { TYPE_DESCRIPTIONS } from './typeDescriptions'

// Frozen head-tag copy for the 21 type pages: count-led title shape, tab-title
// length, and the title's count restated in the description. Counts are
// hardcoded to the seeded dataset; the e2e type-seo spec pins them against the
// live count line, so a data correction must update both together.

const ALL_TYPES = [...COLLECTIBLES, ...UPGRADES, ...COSMETICS, ...MATERIALS]

describe('TYPE_SEO', () => {
  it('covers every type slug with non-empty copy', () => {
    expect(ALL_TYPES).toHaveLength(21)
    for (const { slug } of ALL_TYPES) {
      const entry = TYPE_SEO[slug]
      expect(entry.title.length).toBeGreaterThan(0)
      expect(entry.description.length).toBeGreaterThan(0)
    }
  })

  it('titles are count-led', () => {
    for (const { slug } of ALL_TYPES) {
      expect(TYPE_SEO[slug].title).toMatch(/^All \d+ /)
    }
  })

  it('keeps titles within 38 chars so the suffixed tab title stays within 60', () => {
    for (const { slug } of ALL_TYPES) {
      expect(TYPE_SEO[slug].title.length).toBeLessThanOrEqual(38)
    }
  })

  it('restates the title count in the description', () => {
    for (const { slug } of ALL_TYPES) {
      const { title, description } = TYPE_SEO[slug]
      const count = title.match(/\d+/)?.[0]
      expect(count).toBeTruthy()
      expect(description).toContain(` ${count} `)
    }
  })

  it('opens every TYPE_DESCRIPTIONS intro with the title count', () => {
    // The intro's first numeral is the on-page count claim — it must match the
    // frozen title so a data correction cannot update one without the other.
    for (const { slug } of ALL_TYPES) {
      const introCount = TYPE_DESCRIPTIONS[slug].match(/\d+/)?.[0]
      const titleCount = TYPE_SEO[slug].title.match(/\d+/)?.[0]
      expect(introCount, slug).toBe(titleCount)
    }
  })
})

describe('isTypeSlug', () => {
  it('accepts every navigation type slug', () => {
    for (const { slug } of ALL_TYPES) {
      expect(isTypeSlug(slug)).toBe(true)
    }
  })

  it('rejects values that are not type slugs', () => {
    expect(isTypeSlug('eidos-7')).toBe(false)
    expect(isTypeSlug('items')).toBe(false)
    expect(isTypeSlug('')).toBe(false)
  })
})
