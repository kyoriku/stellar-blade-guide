import { describe, it, expect } from 'vitest'
import { resolveServerTitle } from './serverHead'

// The walkthrough detail skeleton reuses the <title> the server injected, so a
// wrong lift is worse than no lift: it would render a confident, wrong <h1>.
//
// Every rejection case below differs from the control in EXACTLY ONE input, so
// each test pins its own guard. Guard rows carry a title that would otherwise
// peel cleanly; peel rows hold the path valid so only the title is under test.

const TITLE = 'Alpha Signal Walkthrough | Stellar Blade Guide'
const PATH = '/walkthroughs/main-story/alpha-signal'
const TYPE = 'Main Story'

describe('resolveServerTitle', () => {
  it('peels the server title down to the walkthrough title', () => {
    expect(resolveServerTitle(TITLE, PATH, PATH, TYPE)).toBe('Alpha Signal')
  })

  // --- path guards: same title as the control, which would otherwise peel ---

  it('refuses a title captured on a different path (client-side navigation)', () => {
    const navigated = '/walkthroughs/main-story/secret-garden'
    expect(resolveServerTitle(TITLE, PATH, navigated, TYPE)).toBeNull()
  })

  it('refuses a mixed-case path, which the client 404s but the server resolves', () => {
    const mixed = '/walkthroughs/Main-Story/Alpha-Signal'
    expect(resolveServerTitle(TITLE, mixed, mixed, TYPE)).toBeNull()
  })

  it('refuses when capture never ran', () => {
    expect(resolveServerTitle(TITLE, null, PATH, TYPE)).toBeNull()
  })

  // --- peel guards: valid path, so only the title decides ---

  it('refuses a shell with no injected title (the Vite dev server)', () => {
    expect(resolveServerTitle('', PATH, PATH, TYPE)).toBeNull()
    expect(resolveServerTitle(null, PATH, PATH, TYPE)).toBeNull()
  })

  it('refuses the not-found head', () => {
    const notFound = '404 Page Not Found | Stellar Blade Guide'
    expect(resolveServerTitle(notFound, PATH, PATH, TYPE)).toBeNull()
  })

  it('refuses the DB-unavailable variant, which is the mission type not a row', () => {
    const variant = 'Main Story Walkthrough | Stellar Blade Guide'
    expect(resolveServerTitle(variant, PATH, PATH, TYPE)).toBeNull()
  })

  it('refuses a list-page title, whose plural fails the page suffix', () => {
    const list = 'Main Story Walkthroughs | Stellar Blade Guide'
    expect(resolveServerTitle(list, PATH, PATH, TYPE)).toBeNull()
  })

  it('refuses a bare site name (the home page has no title)', () => {
    expect(resolveServerTitle('Stellar Blade Guide', PATH, PATH, TYPE)).toBeNull()
  })

  // SEO.tsx re-appends " | Stellar Blade Guide", so a result that kept the
  // suffix would double it in the tab.
  it('never returns a value still carrying the site suffix', () => {
    const resolved = resolveServerTitle(TITLE, PATH, PATH, TYPE)
    expect(resolved).not.toBeNull()
    expect(resolved).not.toContain(' | Stellar Blade Guide')
  })
})
