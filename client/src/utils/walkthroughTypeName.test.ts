import { describe, it, expect } from 'vitest'
import { WALKTHROUGHS } from '../constants/navigation'
import { walkthroughTypeName } from './walkthroughTypeName'

// This mapping builds the loading head on a walkthrough page: the description,
// canonical and og:image always, and the title whenever the server-injected one
// is unavailable (a client-side nav, a mixed-case URL, or a head the DB could
// not fill). The loaded title is the row's own and never comes from here.
//
// Known slugs must resolve through navigation, never the fallback — the nav
// names carry punctuation ("NieR: Automata DLC") that title-casing a slug
// loses, and serverHead.ts compares this exact string against the injected
// title to tell a real row from the DB-unavailable placeholder. A drifted name
// would make that check accept the placeholder.

describe('walkthroughTypeName', () => {
  it('resolves every navigation mission type to its exact display name', () => {
    for (const { slug, name } of WALKTHROUGHS) {
      expect(walkthroughTypeName(slug)).toBe(name)
    }
  })

  it('pins the DLC names the fallback could not produce', () => {
    expect(walkthroughTypeName('nier-dlc')).toBe('NieR: Automata DLC')
    expect(walkthroughTypeName('nikke-dlc')).toBe('Goddess of Victory: Nikke DLC')
  })

  it('title-cases unknown slugs (the e2e fixture mission type)', () => {
    expect(walkthroughTypeName('e2e-fixture')).toBe('E2e Fixture')
  })

  it('passes an empty string through', () => {
    expect(walkthroughTypeName('')).toBe('')
  })
})
