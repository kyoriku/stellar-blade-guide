import { describe, it, expect } from 'vitest'
import {
  GuestSyncPendingError,
  buildRequest,
  bulkErrorMessage,
  confirmWordMatches,
  pickableCycles,
  scopeForCopy,
  scopeGroups,
  scopeOffered,
  soleCycle,
  targetFromValue,
  wasRefused,
} from './bulkProgress'
import { BULK_COPY } from '../constants/bulkProgressCopy'
import { LEVELS, COLLECTIBLES, COSMETICS } from '../constants/navigation'
import { ApiError, NETWORK_ERROR_MESSAGE } from '../services/api'
import type { CycleStat, LevelStat, TypeStat } from '../services/api'

const level = (name: string, cycles = ['Base']): LevelStat => ({ name, order: 0, completed: 0, total: 1, cycles })
const type = (slug: string, name: string, category: string, cycles = ['Base']): TypeStat =>
  ({ slug, name, category, completed: 0, total: 1, cycles })
const cycle = (name: string, total: number): CycleStat => ({ name, completed: 0, total })

describe('buildRequest', () => {
  it('needs a scope', () => {
    expect(buildRequest('clear', '', '')).toBeNull()
    expect(buildRequest('clear', 'level:', '')).toBeNull()
    expect(buildRequest('clear', 'nonsense', '')).toBeNull()
  })

  it('builds each target shape and sends no cycle key for all cycles', () => {
    expect(buildRequest('clear', 'everything', '')).toEqual({ scope: 'everything', action: 'clear' })
    expect(buildRequest('mark_found', 'level:Eidos 7', '')).toEqual({ scope: 'level', level: 'Eidos 7', action: 'mark_found' })
    expect(buildRequest('clear', 'type:nano-suits', 'NG+')).toEqual({ scope: 'type', type: 'nano-suits', action: 'clear', cycle: 'NG+' })
    expect('cycle' in buildRequest('clear', 'everything', '')!).toBe(false)
  })

  it('keeps a level name that contains the separator intact', () => {
    expect(targetFromValue('level:A: B')).toEqual({ scope: 'level', level: 'A: B' })
  })
})

describe('confirmWordMatches', () => {
  it('ignores case and surrounding spaces, nothing else', () => {
    expect(confirmWordMatches('everything', 'everything')).toBe(true)
    expect(confirmWordMatches('  Everything ', 'everything')).toBe(true)
    expect(confirmWordMatches('every thing', 'everything')).toBe(false)
    expect(confirmWordMatches('everythin', 'everything')).toBe(false)
    expect(confirmWordMatches('', 'everything')).toBe(false)
  })
})

describe('scopeGroups', () => {
  it("lists the static rows in the page's card order before stats load", () => {
    const groups = scopeGroups()
    expect(groups.map(g => g.label)).toEqual([
      null,
      BULK_COPY.groupLevels,
      BULK_COPY.groupCollectibles,
      BULK_COPY.groupUpgrades,
      BULK_COPY.groupCosmetics,
      BULK_COPY.groupOtherSources,
    ])
    expect(groups[0].options).toEqual([{ value: 'everything', label: BULK_COPY.scopeEverything }])
    expect(groups[1].options.map(o => o.label)).toEqual(LEVELS.map(l => l.name))
    expect(groups[2].options.map(o => o.value)).toEqual(COLLECTIBLES.map(t => `type:${t.slug}`))
    expect(groups[4].options.map(o => o.label)).toEqual(COSMETICS.map(t => t.name))
    expect(groups[5].options.map(o => o.value)).toEqual(['level:Default', 'level:Boss Challenge'])
  })

  it('appends levels and types the nav does not know once stats arrive', () => {
    const groups = scopeGroups({
      levels: [level('Eidos 7'), level('Default'), level('New Level')],
      types: [type('cans', 'Can', 'collectibles'), type('relics', 'Relic', 'collectibles')],
    })
    expect(groups[1].options.map(o => o.value)).toEqual(['level:Eidos 7', 'level:New Level'])
    expect(groups[2].options.map(o => o.value)).toEqual(['type:cans', 'type:relics'])
    expect(groups[5].options.map(o => o.value)).toEqual(['level:Default'])
  })

  it('names a scope for the copy', () => {
    const groups = scopeGroups()
    expect(scopeForCopy('type:nano-suits', groups, 'NG+')).toEqual({ label: 'Nano Suits', everything: false, cycle: 'NG+' })
    expect(scopeForCopy('everything', groups, '')).toEqual({ label: BULK_COPY.scopeEverything, everything: true })
    // The copy names the base cycle as the pills do.
    expect(scopeForCopy('level:Eidos 7', groups, 'Base')).toEqual({ label: 'Eidos 7', everything: false, cycle: 'NG' })
  })
})

describe('pickable and sole cycles', () => {
  const stats = {
    levels: [level('Altess Levoire', ['Base']), level('Eidos 7', ['Base', 'NG+', 'NG++', 'DLC'])],
    types: [type('cans', 'Can', 'collectibles', ['Base']), type('nano-suits', 'Nano Suit', 'cosmetics', ['NG+', 'DLC'])],
    cycles: [cycle('Base', 10), cycle('NG+', 2), cycle('NG++', 0), cycle('DLC', 1)],
  }

  it('knows nothing until a scope is chosen and stats have loaded', () => {
    expect(pickableCycles('', stats)).toBeNull()
    expect(pickableCycles('level:Eidos 7', undefined)).toBeNull()
    expect(soleCycle('', stats)).toBeNull()
    expect(soleCycle('level:Altess Levoire', undefined)).toBeNull()
  })

  it('lets a multi-cycle level or type be narrowed to each cycle it holds, and locks none', () => {
    expect([...pickableCycles('level:Eidos 7', stats)!]).toEqual(['Base', 'NG+', 'NG++', 'DLC'])
    expect([...pickableCycles('type:nano-suits', stats)!]).toEqual(['NG+', 'DLC'])
    expect(soleCycle('level:Eidos 7', stats)).toBeNull()
    expect(soleCycle('type:nano-suits', stats)).toBeNull()
  })

  it('locks a single-cycle scope on its cycle, with nothing to narrow to', () => {
    expect(pickableCycles('level:Altess Levoire', stats)!.size).toBe(0)
    expect(pickableCycles('type:cans', stats)!.size).toBe(0)
    expect(soleCycle('level:Altess Levoire', stats)).toBe('Base')
    expect(soleCycle('type:cans', stats)).toBe('Base')
  })

  it('narrows everything to the cycles that hold any collectibles', () => {
    expect([...pickableCycles('everything', stats)!]).toEqual(['Base', 'NG+', 'DLC'])
    expect(soleCycle('everything', stats)).toBeNull()
  })

  it('gives a scope the stats do not list nothing to narrow to and nothing to lock', () => {
    expect(pickableCycles('level:Nest', stats)!.size).toBe(0)
    expect(soleCycle('level:Nest', stats)).toBeNull()
  })

  it('never locks the row on a cycle it has no pill for', () => {
    const later = { ...stats, levels: [...stats.levels, level('New Level', ['DLC2'])] }
    expect(soleCycle('level:New Level', later)).toBeNull()
    expect(pickableCycles('level:New Level', later)!.size).toBe(0)
  })
})

describe('scopeOffered', () => {
  it('knows the static rows, and drops what the loaded rows leave out', () => {
    expect(scopeOffered('everything', scopeGroups())).toBe(true)
    expect(scopeOffered('type:cans', scopeGroups())).toBe(true)
    // Loaded stats without Cans: a pick made from the static rows is gone.
    const loaded = scopeGroups({ levels: [level('Eidos 7')], types: [type('documents', 'Document', 'collectibles')] })
    expect(scopeOffered('type:cans', loaded)).toBe(false)
    expect(scopeOffered('type:documents', loaded)).toBe(true)
    expect(scopeOffered('', loaded)).toBe(false)
  })
})

describe('errors', () => {
  it('treats every 4xx, the rate limit included, as nothing written', () => {
    expect(wasRefused(new ApiError(422, 'Unknown level'))).toBe(true)
    expect(wasRefused(new ApiError(401, 'Not authenticated'))).toBe(true)
    expect(wasRefused(new ApiError(429, 'slow down'))).toBe(true)
    expect(wasRefused(new GuestSyncPendingError())).toBe(true)
    expect(wasRefused(new ApiError(500, 'oops'))).toBe(false)
    expect(wasRefused(new TypeError('Failed to fetch'))).toBe(false)
    expect(wasRefused(new DOMException('signal timed out', 'TimeoutError'))).toBe(false)
  })

  it('never shows refusal text, and keeps the existing sentences for the rest', () => {
    expect(bulkErrorMessage(new ApiError(422, 'Unknown level'), 'apply')).toBe(BULK_COPY.applyError)
    expect(bulkErrorMessage(new GuestSyncPendingError(), 'preview')).toBe(BULK_COPY.previewError)
    expect(bulkErrorMessage(new DOMException('signal timed out', 'TimeoutError'), 'apply')).toBe(BULK_COPY.applyTimeout)
    expect(bulkErrorMessage(new DOMException('signal timed out', 'TimeoutError'), 'preview')).toBe(BULK_COPY.previewTimeout)
    expect(bulkErrorMessage(new TypeError('Failed to fetch'), 'apply')).toBe(NETWORK_ERROR_MESSAGE)
    expect(bulkErrorMessage(new ApiError(429, 'rate sentence'), 'apply')).toBe('rate sentence')
  })
})

describe('counted copy', () => {
  const eidos = { label: 'Eidos 7', everything: false, cycle: 'NG+' }
  const all = { label: 'Everything', everything: true }

  it('uses the singular for one', () => {
    expect(BULK_COPY.dialogBodyClear(1, '1', eidos, false)).toBe('1 collectible in Eidos 7 (NG+) will be marked not found.')
    expect(BULK_COPY.successMarkFound(2, '2', eidos)).toBe('Marked 2 collectibles in Eidos 7 (NG+) as found.')
  })

  it("says it can't be undone only when the scope is mixed", () => {
    expect(BULK_COPY.dialogBodyClear(2, '2', eidos, true)).toBe("2 collectibles in Eidos 7 (NG+) will be marked not found. This can't be undone.")
    expect(BULK_COPY.dialogBodyMarkFound(2, '2', eidos, false)).toBe('2 collectibles in Eidos 7 (NG+) will be marked found.')
  })

  it('gives everything its own wording, and counts only what changes', () => {
    expect(BULK_COPY.dialogBodyMarkFound(1077, '1,077', all, true)).toBe("1,077 collectibles across the whole game will be marked found. This can't be undone.")
    expect(BULK_COPY.successClear(1, '1', { ...all, cycle: 'NG+' })).toBe('Cleared 1 NG+ collectible across the whole game.')
    expect(BULK_COPY.nothingToMark({ ...all, cycle: 'NG+' })).toBe('Every NG+ collectible is already marked found.')
    expect(BULK_COPY.nothingToClear(all)).toBe('Nothing is marked found.')
    expect(BULK_COPY.emptyScope({ ...all, cycle: 'DLC' })).toBe('There are no DLC collectibles.')
  })
})
