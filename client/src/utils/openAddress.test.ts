import { afterEach, describe, it, expect, vi } from 'vitest'
import { isOpenAddress, type Address } from './openAddress'

// An address as a location holds it, split as written: nothing is encoded or decoded.
function at(path: string): Address {
  const hashAt = path.indexOf('#')
  const rest = hashAt < 0 ? path : path.slice(0, hashAt)
  const searchAt = rest.indexOf('?')
  return {
    pathname: searchAt < 0 ? rest : rest.slice(0, searchAt),
    search: searchAt < 0 ? '' : rest.slice(searchAt),
    hash: hashAt < 0 ? '' : path.slice(hashAt),
  }
}

const LEVEL = '/levels/eidos-7'
const DOCS = '/collectibles/documents'
const CARD = `${DOCS}#truth-of-the-cradle`
const WALKTHROUGH = '/walkthroughs/main-story/eye-of-the-hurricane'
const PASSCODES = '/collectibles/passcodes'
// Passcode slugs, as a search result holds them and as the browser reports them.
const GREEK = '\u03b8\u03b8\u03ba\u03ba\u03ba\u03b5'
const GREEK_ENCODED = '%CE%B8%CE%B8%CE%BA%CE%BA%CE%BA%CE%B5'
const OTHER_GREEK = '\u03b8\u03bc\u03ba\u03b1\u03b5\u03b3'

// What is picked, where the router is, where the browser's address is, and whether the pick
// leads to the address already open (a replace) or not (a push).
const ROWS: [string, string, string, string, boolean][] = [
  ['the page itself, nothing moved', LEVEL, LEVEL, LEVEL, true],
  ['the page after a Contents jump', LEVEL, LEVEL, `${LEVEL}#parking-tower`, true],
  ['the page after Back to top from a card', DOCS, CARD, DOCS, true],
  ['the page while at a card', DOCS, CARD, CARD, false],
  ['a card picked again', CARD, CARD, CARD, true],
  ['a card picked again after Back to top', CARD, CARD, DOCS, false],
  ['a card picked again after Contents moved elsewhere', CARD, CARD, `${DOCS}#eidos-7`, false],
  ['the section a Contents jump went to', `${WALKTHROUGH}#turret-gauntlet`, WALKTHROUGH, `${WALKTHROUGH}#turret-gauntlet`, true],
  ['another card', `${DOCS}#the-truth-under-the-city-of-xion`, CARD, CARD, false],
  ['a card, from the top of its page', CARD, DOCS, DOCS, false],
  ['a Greek card picked again, raw against encoded', `${PASSCODES}#${GREEK}`, `${PASSCODES}#${GREEK_ENCODED}`, `${PASSCODES}#${GREEK_ENCODED}`, true],
  ['a Greek card picked again, encoded against raw', `${PASSCODES}#${GREEK_ENCODED}`, `${PASSCODES}#${GREEK}`, `${PASSCODES}#${GREEK}`, true],
  ['another Greek card', `${PASSCODES}#${OTHER_GREEK}`, `${PASSCODES}#${GREEK_ENCODED}`, `${PASSCODES}#${GREEK_ENCODED}`, false],
  ['a hash that does not decode, against the same text', `${DOCS}#%`, `${DOCS}#%`, `${DOCS}#%`, true],
  ['an escape cut short, against the same text', `${PASSCODES}#%CE`, `${PASSCODES}#%CE`, `${PASSCODES}#%CE`, true],
  ['an escape cut short, against the whole one', `${PASSCODES}#%CE`, `${PASSCODES}#%CE%B8`, `${PASSCODES}#%CE%B8`, false],
  ['a hash that does not decode, against one naming its text', `${DOCS}#%`, `${DOCS}#%25`, `${DOCS}#%25`, false],
  ['a hash that does not decode, against none', `${DOCS}#%`, DOCS, DOCS, false],
  ['another page', '/levels/xion', LEVEL, LEVEL, false],
  ['mid-navigation, the page the browser is already on', '/levels/xion', LEVEL, '/levels/xion', true],
  ['mid-navigation, the page the router is still on', LEVEL, LEVEL, '/levels/xion', false],
  ["mid-navigation, where the router's lack of a hash says nothing", '/levels/xion', LEVEL, '/levels/xion#parking-tower', false],
  ['a query the address lacks', `${LEVEL}?ref=e2e`, LEVEL, LEVEL, false],
  ['no query, against an address with a tracking query', LEVEL, `${LEVEL}?fbclid=e2e`, `${LEVEL}?fbclid=e2e`, true],
  ['the same query', `${LEVEL}?ref=e2e`, `${LEVEL}?ref=e2e`, `${LEVEL}?ref=e2e`, true],
  ['another query', `${LEVEL}?ref=a`, `${LEVEL}?ref=b`, `${LEVEL}?ref=b`, false],
  ["'?' is no query", `${LEVEL}?`, `${LEVEL}?fbclid=e2e`, `${LEVEL}?fbclid=e2e`, true],
  ['mid-navigation, a query the browser has and the router lacks', `${LEVEL}?ref=e2e`, LEVEL, `${LEVEL}?ref=e2e`, true],
  ['mid-navigation away from a query, the page the browser is already on', '/levels/xion', `${LEVEL}?ref=e2e`, '/levels/xion', true],
  ['mid-navigation away from a query to a card, the page itself', DOCS, `${DOCS}?ref=e2e`, CARD, false],
  ["'#' against no hash", `${LEVEL}#`, `${LEVEL}#parking-tower`, LEVEL, true],
  ["no hash against '#'", LEVEL, `${LEVEL}#parking-tower`, `${LEVEL}#`, true],
  ["'#' is the page itself after a Contents jump", `${LEVEL}#`, LEVEL, `${LEVEL}#parking-tower`, true],
  ["a router holding '#' holds no hash", LEVEL, `${LEVEL}#`, `${LEVEL}#parking-tower`, true],
]

describe('isOpenAddress', () => {
  for (const [what, to, router, browser, open] of ROWS) {
    it(`${open ? 'replaces' : 'pushes'}: ${what}`, () => {
      expect(isOpenAddress(to, at(router), at(browser))).toBe(open)
    })
  }
})

describe("isOpenAddress's default, the browser's address", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is read when the pick is made', () => {
    vi.stubGlobal('window', { location: at(`${LEVEL}#parking-tower`) })
    expect(isOpenAddress(LEVEL, at(LEVEL))).toBe(true)
    vi.stubGlobal('window', { location: at('/levels/xion') })
    expect(isOpenAddress(LEVEL, at(LEVEL))).toBe(false)
  })
})
