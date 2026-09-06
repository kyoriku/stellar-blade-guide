import { describe, it, expect } from 'vitest'
import { WALKTHROUGHS } from './navigation'
import seo from './seo.json'

// seo.json's walkthroughTypes section is the server's copy of the navigation
// mission types — server/app/seo_head.py renders `${name} Walkthrough(s)`
// titles from it while the client computes the same via walkthroughTypeName().
// This pins the two sources together so a nav rename can't silently desync
// the injected head tags.

describe('seo.json walkthrough types', () => {
  it('mirrors the navigation mission types exactly', () => {
    const jsonSlugs = Object.keys(seo.walkthroughTypes).sort()
    const navSlugs = WALKTHROUGHS.map(w => w.slug).slice().sort()
    expect(jsonSlugs).toEqual(navSlugs)
    for (const { slug, name } of WALKTHROUGHS) {
      expect(seo.walkthroughTypes[slug].name).toBe(name)
    }
  })
})
