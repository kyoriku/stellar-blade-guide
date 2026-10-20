import { describe, it, expect } from 'vitest'
import { WALKTHROUGHS } from './navigation'
import { walkthroughTypeSeo, walkthroughPageSeo } from './walkthroughSeo'

// Hand-written head copy for walkthrough categories and pages (seo.json). These
// pin its copy contract, the one the level and type pages follow: tab titles
// within 60 characters, descriptions within 160, a page title with a count leads
// with All and the count, which its description restates, no deictic words or em
// dashes. A category title carries no count, like the walkthroughs index title,
// because what a category holds keeps growing.
// A category or page without its own copy keeps the generated head byte for byte.

// Categories with their own list-page copy (title, description and intro), and the
// pages with their own copy, by category.
const CATEGORIES_WITH_COPY = ['fishing']
const PAGES_WITH_COPY: Record<string, string[]> = {
  'main-story': ['eve-protocol'],
  fishing: ['fishing-overview', 'all-fish', 'fishing-spots', 'bait-and-fishing-data'],
}

const withCopy = WALKTHROUGHS.filter(w => CATEGORIES_WITH_COPY.includes(w.slug))
const withPageCopy = WALKTHROUGHS.filter(w => Object.hasOwn(PAGES_WITH_COPY, w.slug))

function pagesOf(slug: string) {
  return Object.entries(walkthroughTypeSeo(slug)?.pages ?? {})
}

const allPages = () => withPageCopy.flatMap(({ slug }) => pagesOf(slug).map(([, page]) => page))

describe('walkthroughSeo', () => {
  it('gives every category with copy a title, a description and an intro', () => {
    for (const { slug } of withCopy) {
      const entry = walkthroughTypeSeo(slug)
      expect(entry?.title?.length).toBeGreaterThan(0)
      expect(entry?.description?.length).toBeGreaterThan(0)
      expect(entry?.intro?.length).toBeGreaterThan(0)
    }
  })

  it('leaves every other category, and every other page, on the generated head', () => {
    for (const { slug } of WALKTHROUGHS) {
      const entry = walkthroughTypeSeo(slug)
      expect(entry).toBeDefined()
      if (!CATEGORIES_WITH_COPY.includes(slug)) {
        expect(entry).not.toHaveProperty('title')
        expect(entry).not.toHaveProperty('description')
        expect(entry).not.toHaveProperty('intro')
      }
      if (!Object.hasOwn(PAGES_WITH_COPY, slug)) {
        expect(entry).not.toHaveProperty('pages')
      }
    }
  })

  it('keeps every title within 38 chars so the suffixed tab title stays within 60', () => {
    for (const { slug } of withCopy) {
      expect(walkthroughTypeSeo(slug)!.title!.length).toBeLessThanOrEqual(38)
    }
    for (const page of allPages()) {
      expect(page.title.length).toBeLessThanOrEqual(38)
    }
  })

  it('keeps every description within 160 characters', () => {
    const descriptions = [...withCopy.map(({ slug }) => walkthroughTypeSeo(slug)!.description!),
      ...allPages().map(page => page.description)]
    for (const d of descriptions) {
      expect(d.length).toBeLessThanOrEqual(160)
    }
  })

  it('leads a counted page title with All and the count, restated in its description', () => {
    for (const { title, description } of allPages()) {
      const count = title.match(/\d+/)?.[0]
      if (count === undefined) continue // a title without a count is free
      expect(title).toMatch(new RegExp(`^All ${count} `))
      expect(description).toMatch(new RegExp(`\\b${count}\\b`))
    }
  })

  it('bans deictic words and em dashes from every string', () => {
    const strings = [
      ...withCopy.flatMap(({ slug }) => {
        const entry = walkthroughTypeSeo(slug)!
        return [entry.title!, entry.description!, entry.intro!]
      }),
      ...allPages().flatMap(page => [page.title, page.description]),
    ]
    for (const s of strings) {
      expect(s).not.toMatch(/\b(below|here|this page)\b/i)
      expect(s).not.toContain('\u2014') // em dash
    }
  })

  it('misses prototype keys and unknown segments', () => {
    expect(walkthroughTypeSeo('constructor')).toBeUndefined()
    expect(walkthroughTypeSeo('__proto__')).toBeUndefined()
    expect(walkthroughTypeSeo('no-such-type')).toBeUndefined()
    expect(walkthroughPageSeo('fishing', 'constructor')).toBeUndefined()
    expect(walkthroughPageSeo('fishing', 'no-such-page')).toBeUndefined()
    expect(walkthroughPageSeo('main-story', 'constructor')).toBeUndefined()
    expect(walkthroughPageSeo('constructor', 'all-fish')).toBeUndefined()
  })

  it('gives each page with copy a title and a description, and no other page any', () => {
    for (const [category, slugs] of Object.entries(PAGES_WITH_COPY)) {
      expect(pagesOf(category).map(([slug]) => slug).sort()).toEqual([...slugs].sort())
      for (const slug of slugs) {
        expect(walkthroughPageSeo(category, slug)?.title.length).toBeGreaterThan(0)
        expect(walkthroughPageSeo(category, slug)?.description.length).toBeGreaterThan(0)
      }
    }
  })
})
