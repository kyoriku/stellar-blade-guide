import { describe, it, expect } from 'vitest'
import { WALKTHROUGHS } from './navigation'
import { walkthroughTypeSeo, walkthroughPageSeo } from './walkthroughSeo'

// Hand-written head copy for walkthrough categories and pages (seo.json). These
// pin its copy contract, the one the level and type pages follow: tab titles
// within 60 characters, descriptions within 160, a page title with a count leads
// with All and the count, which its description restates, no deictic words or em
// dashes. A category title carries no count, like the walkthroughs index title,
// because what a category holds keeps growing.
// Every category without its own copy keeps the generated head byte for byte.

const CATEGORIES_WITH_COPY = ['fishing']
const FISHING_PAGES = ['fishing-overview', 'all-fish', 'fishing-spots', 'bait-and-fishing-data']

const withCopy = WALKTHROUGHS.filter(w => CATEGORIES_WITH_COPY.includes(w.slug))

function pagesOf(slug: string) {
  return Object.entries(walkthroughTypeSeo(slug)?.pages ?? {})
}

describe('walkthroughSeo', () => {
  it('gives every category with copy a title, a description and an intro', () => {
    for (const { slug } of withCopy) {
      const entry = walkthroughTypeSeo(slug)
      expect(entry?.title?.length).toBeGreaterThan(0)
      expect(entry?.description?.length).toBeGreaterThan(0)
      expect(entry?.intro?.length).toBeGreaterThan(0)
    }
  })

  it('leaves every other category on the generated head', () => {
    for (const { slug } of WALKTHROUGHS) {
      if (CATEGORIES_WITH_COPY.includes(slug)) continue
      const entry = walkthroughTypeSeo(slug)
      expect(entry).toBeDefined()
      expect(entry).not.toHaveProperty('title')
      expect(entry).not.toHaveProperty('description')
      expect(entry).not.toHaveProperty('intro')
      expect(entry).not.toHaveProperty('pages')
    }
  })

  it('keeps every title within 38 chars so the suffixed tab title stays within 60', () => {
    for (const { slug } of withCopy) {
      expect(walkthroughTypeSeo(slug)!.title!.length).toBeLessThanOrEqual(38)
      for (const [, page] of pagesOf(slug)) {
        expect(page.title.length).toBeLessThanOrEqual(38)
      }
    }
  })

  it('keeps every description within 160 characters', () => {
    for (const { slug } of withCopy) {
      const entry = walkthroughTypeSeo(slug)!
      for (const d of [entry.description!, ...pagesOf(slug).map(([, p]) => p.description)]) {
        expect(d.length).toBeLessThanOrEqual(160)
      }
    }
  })

  it('leads a counted page title with All and the count, restated in its description', () => {
    for (const { slug } of withCopy) {
      for (const [, { title, description }] of pagesOf(slug)) {
        const count = title.match(/\d+/)?.[0]
        if (count === undefined) continue // a title without a count is free
        expect(title).toMatch(new RegExp(`^All ${count} `))
        expect(description).toMatch(new RegExp(`\\b${count}\\b`))
      }
    }
  })

  it('bans deictic words and em dashes from every string', () => {
    for (const { slug } of withCopy) {
      const entry = walkthroughTypeSeo(slug)!
      const strings = [entry.title!, entry.description!, entry.intro!,
        ...pagesOf(slug).flatMap(([, p]) => [p.title, p.description])]
      for (const s of strings) {
        expect(s).not.toMatch(/\b(below|here|this page)\b/i)
        expect(s).not.toContain('\u2014') // em dash
      }
    }
  })

  it('misses prototype keys and unknown segments', () => {
    expect(walkthroughTypeSeo('constructor')).toBeUndefined()
    expect(walkthroughTypeSeo('__proto__')).toBeUndefined()
    expect(walkthroughTypeSeo('no-such-type')).toBeUndefined()
    expect(walkthroughPageSeo('fishing', 'constructor')).toBeUndefined()
    expect(walkthroughPageSeo('fishing', 'no-such-page')).toBeUndefined()
    expect(walkthroughPageSeo('constructor', 'all-fish')).toBeUndefined()
  })

  it('gives each fishing page a title and a description', () => {
    expect(pagesOf('fishing').map(([slug]) => slug).sort()).toEqual([...FISHING_PAGES].sort())
    for (const slug of FISHING_PAGES) {
      expect(walkthroughPageSeo('fishing', slug)?.title.length).toBeGreaterThan(0)
      expect(walkthroughPageSeo('fishing', slug)?.description.length).toBeGreaterThan(0)
    }
  })
})
