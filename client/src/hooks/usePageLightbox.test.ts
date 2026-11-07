import { describe, it, expect } from 'vitest'
import {
  buildPageSlides,
  slideIndex,
  levelPageGalleries,
  typePageGalleries,
  walkthroughGalleries,
  type GallerySource,
  type PageSlides,
} from './usePageLightbox'
import { isValidGalleryImage } from '../utils/image'

// The pure half of usePageLightbox: the slides a page's lightbox holds, and the
// slide a thumbnail click opens. Plain file names stand in for image URLs: the
// image pipeline's manifest check (generate_variants.py) counts R2 and
// /assets/images URLs in client source as live references, and nothing here
// reads a URL anyway.
const img = (url: string, alt = url) => ({ url, alt })

/** Where a click on thumbnail `position` of gallery `key` opens; fails the test if nothing would. */
function open(page: PageSlides, key: number, position: number): number {
  const index = slideIndex(page, key, position)
  if (index === null) throw new Error(`no slide for gallery ${key}, thumbnail ${position}`)
  return index
}

// Every thumbnail the page shows, in page order, numbered as ImageGallery numbers them.
const thumbnails = (galleries: GallerySource[]) =>
  galleries.flatMap(g =>
    g.images.filter(isValidGalleryImage).map((image, position) => ({ key: g.key, position, image })))

// The lookup this replaced: the first slide holding the clicked file.
const firstWithUrl = (page: PageSlides, url: string) => page.slides.findIndex(s => s.src === url)

// Xion in miniature, in page order. Solar Tower [929] is the first card with the map
// shot and Planet Diving Suit (2nd) [936] the first with Roxanne's; Prototype Planet
// Diving Suit [954] and Prototype Planet Diving Suit V2 [955] repeat both before
// their own inventory shots.
const XION: GallerySource[] = [
  { key: 929, images: [img('solar-tower.webp'), img('map.webp')] },
  { key: 936, images: [img('roxanne.webp'), img('map.webp'), img('inventory-936.webp')] },
  { key: 954, images: [img('roxanne.webp'), img('map.webp'), img('inventory-954.webp')] },
  { key: 955, images: [img('roxanne.webp'), img('map.webp'), img('inventory-955.webp')] },
]

describe('slideIndex', () => {
  const page = buildPageSlides(XION)

  it('opens on the thumbnail clicked, not the first card that uses its file', () => {
    // The reported repro: [954]'s first image, then two slides on.
    const opened = open(page, 954, 0)
    expect(opened).toBe(5)
    expect(firstWithUrl(page, 'roxanne.webp')).toBe(2) // where the old lookup opened
    expect(page.slides[opened + 2].src).toBe('inventory-954.webp')
    // Its map shot, which Solar Tower [929] shows first.
    expect(open(page, 954, 1)).toBe(6)
    expect(firstWithUrl(page, 'map.webp')).toBe(1)
  })

  it('gives every thumbnail its own slide, in page order', () => {
    const shown = thumbnails(XION)
    expect(shown.map(t => open(page, t.key, t.position))).toEqual(shown.map((_, i) => i))
    expect(page.slides).toEqual(shown.map(t => ({ src: t.image.url, alt: t.image.alt })))
  })

  it("keeps a card's images together, between its neighbours'", () => {
    expect(open(page, 954, 2) + 1).toBe(open(page, 955, 0))
    expect(open(page, 954, 0) - 1).toBe(open(page, 936, 2))
  })

  it('opens the first thumbnail on the first slide and the last on the last', () => {
    expect(open(page, 929, 0)).toBe(0)
    expect(open(page, 955, 2)).toBe(page.slides.length - 1)
  })

  it('opens nothing for a gallery or thumbnail the page does not show', () => {
    expect(slideIndex(page, 1234, 0)).toBeNull()
    expect(slideIndex(page, 954, 3)).toBeNull()
    expect(slideIndex(page, 954, -1)).toBeNull()
    expect(slideIndex(page, 954, 0.5)).toBeNull()
  })
})

describe('buildPageSlides', () => {
  it('leaves out the images ImageGallery skips, and counts positions among the rest', () => {
    const images = [img('a.webp'), { url: '', alt: 'no file' }, { url: 'b.webp', alt: '' }, img('c.webp')]
    const page = buildPageSlides([{ key: 1, images }, { key: 2, images: [img('d.webp')] }])
    expect(page.slides.map(s => s.src)).toEqual(['a.webp', 'c.webp', 'd.webp'])
    expect(page.slides.slice(0, 2).map(s => s.src)).toEqual(images.filter(isValidGalleryImage).map(i => i.url))
    expect(open(page, 1, 1)).toBe(1) // c.webp is the gallery's second thumbnail
    expect(slideIndex(page, 1, 2)).toBeNull()
    expect(open(page, 2, 0)).toBe(2)
  })

  it('gives each copy of a file repeated within one card its own slide', () => {
    const page = buildPageSlides([
      { key: 1, images: [img('a.webp')] },
      { key: 2, images: [img('spot.webp', 'first'), img('item.webp'), img('spot.webp', 'again')] },
    ])
    expect([0, 1, 2].map(p => open(page, 2, p))).toEqual([1, 2, 3])
    expect(page.slides[open(page, 2, 2)]).toEqual({ src: 'spot.webp', alt: 'again' })
  })

  it('adds nothing for a card with no images, and its neighbours keep their places', () => {
    const page = buildPageSlides([
      { key: 1, images: [img('a.webp')] },
      { key: 2, images: [] },
      { key: 3, images: [img('b.webp')] },
    ])
    expect(page.slides.map(s => s.src)).toEqual(['a.webp', 'b.webp'])
    expect(slideIndex(page, 2, 0)).toBeNull()
    expect(open(page, 3, 0)).toBe(1)
  })

  it('holds nothing when a filter empties the page', () => {
    const page = buildPageSlides([])
    expect(page.slides).toEqual([])
    expect(slideIndex(page, 954, 0)).toBeNull()
  })

  it("keeps a repeated key on its first gallery and still holds both galleries' slides", () => {
    const page = buildPageSlides([{ key: 1, images: [img('a.webp')] }, { key: 1, images: [img('b.webp')] }])
    expect(page.slides.map(s => s.src)).toEqual(['a.webp', 'b.webp'])
    expect(open(page, 1, 0)).toBe(0)
  })
})

describe('the page walkers', () => {
  const card = (id: number, ...urls: string[]) => ({ id, images: urls.map(u => img(u)) })

  it('walk a level page location by location, card by card', () => {
    const locations = [
      { collectibles: [card(3, 'x.webp'), card(1)] },
      { collectibles: [card(2, 'y.webp', 'x.webp')] },
    ]
    expect(levelPageGalleries(locations).map(g => g.key)).toEqual([3, 1, 2])
    const page = buildPageSlides(levelPageGalleries(locations))
    expect(page.slides.map(s => s.src)).toEqual(['x.webp', 'y.webp', 'x.webp'])
    expect(open(page, 2, 1)).toBe(2)
  })

  it('walk a type page level by level, and its A-Z view as the one list it renders', () => {
    const levels = [
      { locations: [{ collectibles: [card(5, 'p.webp')] }, { collectibles: [card(4, 'q.webp')] }] },
      { locations: [{ collectibles: [card(6, 'p.webp')] }] },
    ]
    expect(typePageGalleries(levels).map(g => g.key)).toEqual([5, 4, 6])
    const az = [{ locations: [{ collectibles: [card(6, 'p.webp'), card(4, 'q.webp'), card(5, 'p.webp')] }] }]
    expect(open(buildPageSlides(typePageGalleries(az)), 5, 0)).toBe(2)
  })

  it('key walkthrough sections by index, since an image order only counts within its section', () => {
    // Lost Ark's shape: Solving the Puzzle reuses Finding the Rebel's file, under
    // the same image orders and another alt.
    const sections = [
      { order: 1, images: [] },
      { order: 2, images: [{ url: 'rebel.webp', alt: 'Document', order: 1 }, { url: 'terminal.webp', alt: 'Document', order: 2 }] },
      { order: 9, images: [{ url: 'puzzle.webp', alt: 'Puzzle', order: 1 }, { url: 'terminal.webp', alt: 'Terminal Hints', order: 2 }] },
    ]
    expect(walkthroughGalleries(sections).map(g => g.key)).toEqual([0, 1, 2])
    const page = buildPageSlides(walkthroughGalleries(sections))
    expect(open(page, 2, 1)).toBe(3)
    expect(page.slides[3]).toEqual({ src: 'terminal.webp', alt: 'Terminal Hints' })
    expect(firstWithUrl(page, 'terminal.webp')).toBe(1)
  })

  it('give a walkthrough no galleries before it loads', () => {
    expect(walkthroughGalleries(undefined)).toEqual([])
  })
})
