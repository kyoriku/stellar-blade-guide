import { describe, it, expect } from 'vitest'
import { slugifyTitle, buildSlugMap } from './slugify'

// These cases mirror server/tests/test_slugify.py one-for-one: the server's
// _slugify_title/_build_slug_map must stay byte-identical to these functions
// (search-result anchors are generated server-side and resolved client-side),
// so the contract is pinned from both sides.

describe('slugifyTitle', () => {
  it('turns a single star into 1', () => {
    expect(slugifyTitle('Ranged Enhancement Gear ★ / Supply Box')).toBe(
      'ranged-enhancement-gear-1-supply-box',
    )
  })

  it('turns a double star into 2', () => {
    expect(slugifyTitle('Ranged Enhancement Gear ★★ / Supply Box')).toBe(
      'ranged-enhancement-gear-2-supply-box',
    )
  })

  it('turns a triple star into 3', () => {
    expect(slugifyTitle('Ranged Enhancement Gear ★★★')).toBe('ranged-enhancement-gear-3')
  })

  it('produces distinct slugs for star variants', () => {
    const slugs = new Set([
      slugifyTitle('Gear ★'),
      slugifyTitle('Gear ★★'),
      slugifyTitle('Gear ★★★'),
    ])
    expect(slugs.size).toBe(3)
  })

  it('leaves star-free titles unchanged', () => {
    expect(slugifyTitle('Supply Camp')).toBe('supply-camp')
  })

  it('strips apostrophes', () => {
    expect(slugifyTitle("Legionnaire 451's Resolution")).toBe('legionnaire-451s-resolution')
  })
})

describe('buildSlugMap', () => {
  it('suffixes duplicates positionally in iteration order', () => {
    const m = buildSlugMap([
      { id: 5, title: 'Body Core' },
      { id: 9, title: 'Body Core' },
      { id: 12, title: 'Body Core' },
    ])
    expect(m.get(5)).toBe('body-core-1')
    expect(m.get(9)).toBe('body-core-2')
    expect(m.get(12)).toBe('body-core-3')
  })

  it('leaves unique titles bare', () => {
    const m = buildSlugMap([
      { id: 1, title: 'Body Core' },
      { id: 2, title: 'Supply Camp' },
    ])
    expect(m.get(1)).toBe('body-core')
    expect(m.get(2)).toBe('supply-camp')
  })

  it('is order-dependent (the anchor contract)', () => {
    const a = { id: 1, title: 'Supply Box' }
    const b = { id: 2, title: 'Supply Box' }
    const forward = buildSlugMap([a, b])
    const reversed = buildSlugMap([b, a])
    expect(forward.get(1)).toBe('supply-box-1')
    expect(forward.get(2)).toBe('supply-box-2')
    expect(reversed.get(2)).toBe('supply-box-1')
    expect(reversed.get(1)).toBe('supply-box-2')
  })

  it('keeps star variants distinct and bare', () => {
    const m = buildSlugMap([
      { id: 1, title: 'Gear ★' },
      { id: 2, title: 'Gear ★★' },
      { id: 3, title: 'Gear ★★★' },
    ])
    expect(m.get(1)).toBe('gear-1')
    expect(m.get(2)).toBe('gear-2')
    expect(m.get(3)).toBe('gear-3')
  })
})
