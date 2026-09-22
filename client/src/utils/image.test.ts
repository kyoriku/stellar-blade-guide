import { describe, it, expect } from 'vitest'
import {
  thumbnailUrl,
  ogImageUrl,
  buildSrcSet,
  GALLERY_WIDTHS,
  isValidGalleryImage,
  gallerySizes,
  SINGLE_SIZES,
  GRID_SIZES,
} from './image'

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

// url and alt are both required strings on CollectibleImage, so the invalid
// cases are empty strings rather than missing fields — no cast needed.
describe('isValidGalleryImage', () => {
  it('accepts an image with both a url and an alt', () => {
    expect(isValidGalleryImage({ url: R2, alt: 'a camp' })).toBe(true)
  })

  it('rejects an empty alt', () => {
    expect(isValidGalleryImage({ url: R2, alt: '' })).toBe(false)
  })

  it('rejects an empty url', () => {
    expect(isValidGalleryImage({ url: '', alt: 'a camp' })).toBe(false)
  })

  it('rejects both empty', () => {
    expect(isValidGalleryImage({ url: '', alt: '' })).toBe(false)
  })
})

// usePrefetch and ImageGallery both derive `sizes` from this. If they ever
// disagree the prefetch warms a srcset candidate the gallery never requests,
// which is what the shared predicate above exists to prevent.
describe('gallerySizes', () => {
  it('uses the single-image sizes for one valid image', () => {
    expect(gallerySizes([{ url: R2, alt: 'one' }])).toBe(SINGLE_SIZES)
  })

  it('uses the grid sizes for two valid images', () => {
    expect(gallerySizes([
      { url: R2, alt: 'one' },
      { url: R2, alt: 'two' },
    ])).toBe(GRID_SIZES)
  })

  it('counts only renderable images, so an alt-less second image still reads as single', () => {
    expect(gallerySizes([
      { url: R2, alt: 'one' },
      { url: R2, alt: '' },
    ])).toBe(SINGLE_SIZES)
  })

  it('uses the grid sizes for an empty gallery', () => {
    expect(gallerySizes([])).toBe(GRID_SIZES)
  })
})
