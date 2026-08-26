import { describe, it, expect } from 'vitest'
import {
  pct,
  typeRows,
  levelRows,
  nonLevelRows,
  cycleRows,
  LEVEL_ROWS_STATIC,
  NON_LEVEL_ROWS_STATIC,
  CYCLE_NAMES,
} from './progressRows'
import type { TypeStat, LevelStat, CycleStat } from '../services/api'

const NAV = [
  { slug: 'cans', name: 'Cans' },
  { slug: 'documents', name: 'Documents' },
  { slug: 'camps', name: 'Camps' },
] as const

const t = (slug: string, name: string, category = 'collectibles'): TypeStat => ({
  slug,
  name,
  category,
  completed: 1,
  total: 2,
})

describe('pct', () => {
  it('floors so 100% only means true completion', () => {
    expect(pct(1077, 1078)).toBe(99)
    expect(pct(1078, 1078)).toBe(100)
  })

  it('guards zero totals', () => {
    expect(pct(0, 0)).toBe(0)
  })

  it('handles zero completed', () => {
    expect(pct(0, 50)).toBe(0)
  })
})

describe('typeRows', () => {
  it('renders static nav rows with null stats while loading', () => {
    const rows = typeRows(undefined, 'collectibles', NAV)
    expect(rows.map(r => r.key)).toEqual(['cans', 'documents', 'camps'])
    expect(rows.every(r => r.stat === null)).toBe(true)
    expect(rows.every(r => r.slug !== null)).toBe(true)
  })

  it('orders loaded rows by nav order with navbar labels, not server order/names', () => {
    // Server returns display_order (camps first) and singular names.
    const server = [t('camps', 'Camp'), t('cans', 'Can'), t('documents', 'Document')]
    const rows = typeRows(server, 'collectibles', NAV)
    expect(rows.map(r => r.key)).toEqual(['cans', 'documents', 'camps'])
    expect(rows.map(r => r.label)).toEqual(['Cans', 'Documents', 'Camps'])
  })

  it('appends server types the nav constants do not know', () => {
    const server = [t('cans', 'Can'), t('new-type', 'New Type')]
    const rows = typeRows(server, 'collectibles', NAV)
    expect(rows.map(r => r.key)).toEqual(['cans', 'new-type'])
    expect(rows[1].label).toBe('New Type')
  })

  it('drops nav types absent from the loaded response', () => {
    const rows = typeRows([t('cans', 'Can')], 'collectibles', NAV)
    expect(rows.map(r => r.key)).toEqual(['cans'])
  })

  it('filters by category', () => {
    const server = [t('cans', 'Can', 'collectibles'), t('gear', 'Gear', 'upgrades')]
    const rows = typeRows(server, 'collectibles', NAV)
    expect(rows.map(r => r.key)).toEqual(['cans'])
  })
})

const lvl = (name: string, order = 1): LevelStat => ({ name, order, completed: 0, total: 1 })

describe('levelRows / nonLevelRows', () => {
  it('lists exactly the 10 nav levels while loading, all linked', () => {
    const rows = levelRows(undefined)
    expect(rows).toHaveLength(LEVEL_ROWS_STATIC.length)
    expect(rows.every(r => r.slug !== null && r.stat === null)).toBe(true)
  })

  it('routes Default and Boss Challenge to the non-level section, never By Level', () => {
    const server = [lvl('Eidos 7'), lvl('Default'), lvl('Boss Challenge')]
    expect(levelRows(server).map(r => r.key)).toEqual(['Eidos 7'])
    expect(nonLevelRows(server).map(r => r.key)).toEqual(['Default', 'Boss Challenge'])
  })

  it('appends unknown server levels to By Level', () => {
    const rows = levelRows([lvl('Eidos 7'), lvl('New DLC Level')])
    expect(rows.map(r => r.key)).toEqual(['Eidos 7', 'New DLC Level'])
    expect(rows[1].slug).toBeNull()
  })

  it('keeps the non-level section static while loading', () => {
    const rows = nonLevelRows(undefined)
    expect(rows.map(r => r.key)).toEqual(NON_LEVEL_ROWS_STATIC.map(r => r.key))
    expect(rows.every(r => r.stat === null)).toBe(true)
  })
})

const cyc = (name: string): CycleStat => ({ name, completed: 0, total: 1 })

describe('cycleRows', () => {
  it('shows the four cycles in fixed order while loading', () => {
    expect(cycleRows(undefined).map(r => r.key)).toEqual(CYCLE_NAMES)
  })

  it('orders loaded cycles by the fixed ranking regardless of response order', () => {
    const rows = cycleRows([cyc('DLC'), cyc('Base'), cyc('NG+')])
    expect(rows.map(r => r.key)).toEqual(['Base', 'NG+', 'DLC'])
  })

  it('appends unknown cycle names', () => {
    const rows = cycleRows([cyc('Base'), cyc('NG+++')])
    expect(rows.map(r => r.key)).toEqual(['Base', 'NG+++'])
  })
})
