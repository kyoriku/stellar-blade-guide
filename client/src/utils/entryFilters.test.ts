import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, offeredFilters, readFilters, rememberFilters, sameFilters, type PageFilters } from './entryFilters'

const PATH = '/cosmetics/nano-suits'
const NG_PLUS: PageFilters = { cycle: 'NG+', subtype: 'All', sort: 'alphabetical' }
const record = (view: PageFilters, path = PATH) => ({ v: 1, path, ...view })

function fakeHistory(state: unknown, opts: { throws?: boolean } = {}) {
  const history = {
    state,
    calls: 0,
    replaceState(data: unknown) {
      history.calls += 1
      if (opts.throws) throw new DOMException('refused', 'SecurityError')
      history.state = data
    },
  }
  return history
}

describe('readFilters', () => {
  it('gives the defaults for an entry with no record', () => {
    for (const state of [undefined, null, 'x', 7, {}, { other: 1 }, { sbFilters: null }]) {
      expect(readFilters(state, PATH)).toEqual(DEFAULT_FILTERS)
    }
  })

  it("gives the defaults for another page's record or another version's", () => {
    expect(readFilters({ sbFilters: record(NG_PLUS, '/levels/eidos-7') }, PATH)).toEqual(DEFAULT_FILTERS)
    expect(readFilters({ sbFilters: { ...record(NG_PLUS), v: 2 } }, PATH)).toEqual(DEFAULT_FILTERS)
  })

  it('reads the record for the page', () => {
    expect(readFilters({ sbFilters: record(NG_PLUS), from: '/x' }, PATH)).toEqual(NG_PLUS)
    expect(readFilters({ sbFilters: record({ cycle: 'Base', subtype: 'Books', sort: 'default' }) }, PATH))
      .toEqual({ cycle: 'Base', subtype: 'Books', sort: 'default' })
  })

  it('reads a field of the wrong type as its default', () => {
    expect(readFilters({ sbFilters: { v: 1, path: PATH, cycle: 3, subtype: null, sort: 'zigzag' } }, PATH)).toEqual(DEFAULT_FILTERS)
  })
})

describe('rememberFilters', () => {
  const entry = { key: 'k1', pathname: PATH }

  it("writes the record into the entry's usr, keeping the rest of its state", () => {
    const history = fakeHistory({ key: 'k1', idx: 3, usr: { from: '/login' } })
    rememberFilters(history, entry, PATH, NG_PLUS)
    expect(history.state).toEqual({ key: 'k1', idx: 3, usr: { from: '/login', sbFilters: record(NG_PLUS) } })
  })

  it('takes the record away for the default view, and leaves usr null when nothing else is in it', () => {
    const history = fakeHistory({ key: 'k1', idx: 3, usr: { from: '/login', sbFilters: record(NG_PLUS) } })
    rememberFilters(history, entry, PATH, DEFAULT_FILTERS)
    expect(history.state).toEqual({ key: 'k1', idx: 3, usr: { from: '/login' } })

    const bare = fakeHistory({ key: 'k1', idx: 3, usr: { sbFilters: record(NG_PLUS) } })
    rememberFilters(bare, entry, PATH, DEFAULT_FILTERS)
    expect(bare.state).toEqual({ key: 'k1', idx: 3, usr: null })
  })

  it('makes no history call when the entry already holds the view', () => {
    const same = fakeHistory({ key: 'k1', idx: 3, usr: { sbFilters: record(NG_PLUS) } })
    rememberFilters(same, entry, PATH, NG_PLUS)
    const none = fakeHistory({ key: 'k1', idx: 3, usr: null })
    rememberFilters(none, entry, PATH, DEFAULT_FILTERS)
    expect([same.calls, none.calls]).toEqual([0, 0])
  })

  it('leaves the entry alone once the browser has moved on from the one rendered', () => {
    const otherEntry = fakeHistory({ key: 'k2', idx: 4, usr: null })
    rememberFilters(otherEntry, entry, PATH, NG_PLUS)
    const otherPage = fakeHistory({ key: 'k1', idx: 3, usr: null })
    rememberFilters(otherPage, entry, '/levels/xion', NG_PLUS)
    expect([otherEntry.calls, otherPage.calls]).toEqual([0, 0])
  })

  it("writes to an entry with no key of its own, as the one a visit starts on or a typed fragment's", () => {
    const first = fakeHistory({ idx: 0 })
    rememberFilters(first, { key: 'default', pathname: PATH }, PATH, NG_PLUS)
    expect(first.state).toEqual({ idx: 0, usr: { sbFilters: record(NG_PLUS) } })

    const typed = fakeHistory(null)
    rememberFilters(typed, { key: 'default', pathname: PATH }, PATH, NG_PLUS)
    expect(typed.state).toEqual({ usr: { sbFilters: record(NG_PLUS) } })
  })

  it('never throws when the browser refuses the call', () => {
    const history = fakeHistory({ key: 'k1', idx: 3, usr: null }, { throws: true })
    expect(() => rememberFilters(history, entry, PATH, NG_PLUS)).not.toThrow()
    expect(history.calls).toBe(1)
  })
})

describe('offeredFilters', () => {
  it('keeps what the page can show, as the same object', () => {
    const view: PageFilters = { cycle: 'NG+', subtype: 'Books', sort: 'alphabetical' }
    expect(offeredFilters(view, ['Base', 'NG+'], ['Books', 'Journal'])).toBe(view)
    expect(offeredFilters(DEFAULT_FILTERS, [], null)).toBe(DEFAULT_FILTERS)
  })

  it('puts a cycle or subtype the page lacks back to All, and keeps the sort', () => {
    expect(offeredFilters({ cycle: 'NG++', subtype: 'All', sort: 'alphabetical' }, ['Base', 'NG+'], null))
      .toEqual({ cycle: 'All', subtype: 'All', sort: 'alphabetical' })
    expect(offeredFilters({ cycle: 'All', subtype: 'Prayers', sort: 'default' }, [], ['Books']))
      .toEqual(DEFAULT_FILTERS)
  })

  it('puts a filter back to All when the page shows no control for it', () => {
    expect(offeredFilters({ cycle: 'NG+', subtype: 'Books', sort: 'default' }, [], null)).toEqual(DEFAULT_FILTERS)
  })
})

describe('sameFilters', () => {
  it('compares every field', () => {
    expect(sameFilters(NG_PLUS, { ...NG_PLUS })).toBe(true)
    expect(sameFilters(NG_PLUS, { ...NG_PLUS, sort: 'default' })).toBe(false)
    expect(sameFilters(NG_PLUS, { ...NG_PLUS, subtype: 'Books' })).toBe(false)
    expect(sameFilters(NG_PLUS, { ...NG_PLUS, cycle: 'All' })).toBe(false)
  })
})
