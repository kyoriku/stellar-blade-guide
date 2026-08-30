import { describe, it, expect } from 'vitest'
import { thumbnailUrl, ogImageUrl, buildSrcSet, GALLERY_WIDTHS } from './image'

// Fixture must stay in the site/ namespace: the image pipeline's manifest check
// (generate_variants.py) scans all client source for collectibles/walkthroughs
// R2 URLs and treats them as live content references; site/ keys are exempt.
const R2 = 'https://img.stellarbladeguide.com/stellar-blade/site/example.webp'

describe('thumbnailUrl', () => {
  it('inserts the width variant before .webp for R2 URLs', () => {
    expect(thumbnailUrl(R2, 640)).toBe(
      'https://img.stellarbladeguide.com/stellar-blade/site/example-w640.webp',
    )
  })

  it('defaults to the 1200 variant', () => {
    expect(thumbnailUrl(R2)).toContain('-w1200.webp')
  })

  it('passes non-R2 URLs through unchanged', () => {
    const cloudinary = 'https://res.cloudinary.com/demo/avatar.webp'
    expect(thumbnailUrl(cloudinary, 640)).toBe(cloudinary)
  })

  it('passes non-webp R2 URLs through unchanged', () => {
    const png = 'https://img.stellarbladeguide.com/stellar-blade/site/thing.png'
    expect(thumbnailUrl(png, 640)).toBe(png)
  })
})

describe('ogImageUrl', () => {
  it('returns the 1200-wide variant', () => {
    expect(ogImageUrl(R2)).toContain('-w1200.webp')
  })
})

describe('buildSrcSet', () => {
  it('emits one entry per gallery width with width descriptors', () => {
    const entries = buildSrcSet(R2).split(', ')
    expect(entries).toHaveLength(GALLERY_WIDTHS.length)
    GALLERY_WIDTHS.forEach((w, i) => {
      expect(entries[i]).toBe(`${thumbnailUrl(R2, w)} ${w}w`)
    })
  })
})
