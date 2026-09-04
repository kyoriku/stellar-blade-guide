import { describe, it, expect } from 'vitest'
import { WALKTHROUGHS } from '../constants/navigation'
import { walkthroughTypeName } from './walkthroughTypeName'

// Walkthrough page titles (loading and loaded) derive from this mapping. Known
// slugs must resolve through navigation, never the fallback — the nav names
// carry punctuation ("NieR: Automata DLC") that title-casing a slug loses.

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
