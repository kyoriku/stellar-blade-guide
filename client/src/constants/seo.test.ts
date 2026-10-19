import { describe, it, expect } from 'vitest'
import { WALKTHROUGHS } from './navigation'
import seo from './seo.json'

// seo.json's walkthroughTypes section is the server's copy of the navigation
// mission types — server/app/seo_head.py renders `${name} Walkthrough(s)`
// titles from it while the client computes the same via walkthroughTypeName().
// This pins the two sources together so a nav rename can't silently desync
// the injected head tags. Order matters too: search numbers its walkthrough
// categories and breaks their ties by seo.json's key order, so a category
// inserted out of order would reorder search results the navigation never shows.

describe('seo.json walkthrough types', () => {
  it('mirrors the navigation mission types exactly, in order', () => {
    const jsonSlugs = Object.keys(seo.walkthroughTypes)
    const navSlugs = WALKTHROUGHS.map(w => w.slug)
    expect(jsonSlugs).toEqual(navSlugs)
    for (const { slug, name } of WALKTHROUGHS) {
      expect(seo.walkthroughTypes[slug].name).toBe(name)
    }
  })
})
