import { describe, it, expect } from 'vitest'
import {
  ADMIN_SEARCH_MAX,
  adminErrorMessage,
  canChange,
  emailBreakParts,
  joinedDate,
  joinedDateTime,
  listStatus,
  removeRow,
  replaceRow,
  rolePill,
  rowActions,
  searchTooLong,
} from './adminUsers'
import { ADMIN_COPY } from '../constants/adminCopy'
import { ApiError, NETWORK_ERROR_MESSAGE } from '../services/api'

const row = (id: number, extra: Partial<{ role: string; is_active: boolean; username: string }> = {}) => ({
  id,
  username: `user${id}`,
  role: 'user',
  is_active: true,
  ...extra,
})

describe('rowActions', () => {
  it('offers the role change, the status change and Delete, in the menu order', () => {
    expect(rowActions(row(1))).toEqual(['promote', 'deactivate', 'delete'])
    expect(rowActions(row(1, { is_active: false }))).toEqual(['promote', 'reactivate', 'delete'])
    expect(rowActions(row(1, { role: 'moderator' }))).toEqual(['demote', 'deactivate', 'delete'])
    expect(rowActions(row(1, { role: 'moderator', is_active: false }))).toEqual(['demote', 'reactivate', 'delete'])
  })

  it('offers nothing on an admin account, active or not', () => {
    expect(rowActions(row(1, { role: 'admin' }))).toEqual([])
    expect(rowActions(row(1, { role: 'admin', is_active: false }))).toEqual([])
    expect(canChange(row(1, { role: 'admin' }))).toBe(false)
    expect(canChange(row(1, { role: 'moderator' }))).toBe(true)
    expect(canChange(row(1))).toBe(true)
  })

  it('offers Make moderator on a role typed by hand outside the three, so it can be put right', () => {
    expect(rowActions(row(1, { role: 'mod' }))).toEqual(['promote', 'deactivate', 'delete'])
    expect(rowActions(row(1, { role: 'Admin' }))).toEqual(['promote', 'deactivate', 'delete'])
  })
})

describe('rolePill', () => {
  it('shows moderator and admin, and nothing for a user', () => {
    expect(rolePill('moderator')).toBe('moderator')
    expect(rolePill('admin')).toBe('admin')
    expect(rolePill('user')).toBeNull()
  })

  it('shows nothing for a role typed by hand outside the three, rather than a wrong pill', () => {
    for (const role of ['mod', 'Moderator', 'Admin', 'admin ', '']) expect(rolePill(role), role).toBeNull()
  })
})

describe('replaceRow and removeRow', () => {
  const list = [row(3), row(2), row(1)]

  it('replaces a row in place and keeps the others and the order', () => {
    const changed = row(2, { role: 'moderator' })
    const next = replaceRow(list, changed)!
    expect(next.map(r => r.id)).toEqual([3, 2, 1])
    expect(next[1]).toBe(changed)
    expect(next[0]).toBe(list[0])
    expect(next[2]).toBe(list[2])
    expect(list[1].role).toBe('user')
  })

  it("leaves a list that doesn't hold the row as it was, same array", () => {
    expect(replaceRow(list, row(9))).toBe(list)
    expect(removeRow(list, 9)).toBe(list)
  })

  it('removes a row and keeps the order', () => {
    expect(removeRow(list, 2)!.map(r => r.id)).toEqual([3, 1])
    expect(list).toHaveLength(3)
  })

  it('passes no list through', () => {
    expect(replaceRow(undefined, row(1))).toBeUndefined()
    expect(removeRow(undefined, 1)).toBeUndefined()
  })
})

describe('joinedDate and joinedDateTime', () => {
  it('formats like the mock in en-US', () => {
    expect(joinedDate('2026-10-31T12:00:00+00:00', 'en-US', 'UTC')).toBe('Oct 31, 2026')
    expect(joinedDate('2026-09-03T08:00:00Z', 'en-US', 'UTC')).toBe('Sep 3, 2026')
    expect(joinedDateTime('2026-09-03T08:00:00Z', 'UTC')).toBe('2026-09-03')
  })

  it('gives the local day, not the UTC one', () => {
    // 02:30 UTC on November 1 is still October 31 in Toronto, and already November 1 in Tokyo.
    const iso = '2026-11-01T02:30:00Z'
    expect(joinedDate(iso, 'en-US', 'America/Toronto')).toBe('Oct 31, 2026')
    expect(joinedDateTime(iso, 'America/Toronto')).toBe('2026-10-31')
    expect(joinedDate(iso, 'en-US', 'Asia/Tokyo')).toBe('Nov 1, 2026')
    expect(joinedDateTime(iso, 'Asia/Tokyo')).toBe('2026-11-01')
  })

  it('reads the offset the server sends, microseconds included', () => {
    expect(joinedDateTime('2025-11-28T23:59:59.123456-05:00', 'America/Toronto')).toBe('2025-11-28')
    expect(joinedDate('2025-11-28T23:59:59.123456-05:00', 'en-US', 'UTC')).toBe('Nov 29, 2025')
  })

  it('follows the viewer locale', () => {
    expect(joinedDate('2026-10-31T12:00:00Z', 'en-GB', 'UTC')).toBe('31 Oct 2026')
  })

  it('shows nothing for a date it cannot read', () => {
    expect(joinedDate('not a date')).toBe('')
    expect(joinedDateTime('')).toBe('')
  })
})

describe('listStatus', () => {
  const at = (over: Partial<Parameters<typeof listStatus>[0]>) =>
    listStatus({ loaded: true, searching: false, term: '', count: 0, ...over })

  it('says it is loading until a list arrives', () => {
    expect(at({ loaded: false })).toBe(ADMIN_COPY.loading)
    expect(at({ loaded: false, searching: true, term: 'kyo' })).toBe(ADMIN_COPY.loading)
  })

  it('says it is searching while a newer search runs over an older list', () => {
    expect(at({ searching: true, count: 5 })).toBe(ADMIN_COPY.searching)
    expect(at({ searching: true, term: 'kyo', count: 2 })).toBe(ADMIN_COPY.searching)
  })

  it('counts every account with no search', () => {
    expect(at({ count: 412 })).toBe('412 accounts')
    expect(at({ count: 1 })).toBe('1 account')
    expect(at({ count: 1200 })).toBe(`${(1200).toLocaleString()} accounts`)
  })

  it('counts the matches for a search, or says none match', () => {
    expect(at({ term: 'mod', count: 3 })).toBe('3 accounts match')
    expect(at({ term: 'mod', count: 1 })).toBe('1 account matches')
    expect(at({ term: 'mod', count: 0 })).toBe(ADMIN_COPY.noMatches)
  })
})

describe('searchTooLong', () => {
  it("counts code points, as the server's 255 does", () => {
    expect(searchTooLong('a'.repeat(ADMIN_SEARCH_MAX))).toBe(false)
    expect(searchTooLong('a'.repeat(ADMIN_SEARCH_MAX + 1))).toBe(true)
    // An emoji is two UTF-16 units and one character.
    const emoji = String.fromCodePoint(0x1f600)
    expect(emoji).toHaveLength(2)
    expect(searchTooLong(emoji.repeat(ADMIN_SEARCH_MAX))).toBe(false)
    expect(searchTooLong(emoji.repeat(ADMIN_SEARCH_MAX + 1))).toBe(true)
  })
})

describe('adminErrorMessage', () => {
  it('names a timeout, whatever the step', () => {
    const timeout = new DOMException('signal timed out', 'TimeoutError')
    for (const step of ['load', 'reveal', 'role', 'status', 'delete'] as const) {
      expect(adminErrorMessage(timeout, step)).toBe(ADMIN_COPY.timeout)
    }
  })

  it("shows a server 403's detail as sent", () => {
    const refused = new ApiError(403, "Admin accounts can't be changed here.")
    expect(adminErrorMessage(refused, 'role')).toBe("Admin accounts can't be changed here.")
    expect(adminErrorMessage(new ApiError(403, 'Insufficient permissions'), 'load')).toBe('Insufficient permissions')
    expect(adminErrorMessage(new ApiError(403, ''), 'delete')).toBe(ADMIN_COPY.deleteError)
  })

  it("says a row action's account is gone on a 404, but not the list's", () => {
    const missing = new ApiError(404, 'User not found')
    for (const step of ['reveal', 'role', 'status', 'delete'] as const) {
      expect(adminErrorMessage(missing, step)).toBe(ADMIN_COPY.gone)
    }
    expect(adminErrorMessage(missing, 'load')).toBe(ADMIN_COPY.loadError)
  })

  it("keeps the site's rate-limit and offline sentences", () => {
    const limited = new ApiError(429, "You're doing that too fast. Please wait a moment and try again.")
    expect(adminErrorMessage(limited, 'reveal')).toBe(limited.message)
    expect(adminErrorMessage(new TypeError('Failed to fetch'), 'role')).toBe(NETWORK_ERROR_MESSAGE)
  })

  it("gives each step's own sentence for anything else", () => {
    const invalid = new ApiError(422, 'Input should be user or moderator')
    const broken = new ApiError(500, 'Something went wrong on our end. Please try again later.')
    expect(adminErrorMessage(invalid, 'role')).toBe(ADMIN_COPY.roleError)
    expect(adminErrorMessage(broken, 'load')).toBe(ADMIN_COPY.loadError)
    expect(adminErrorMessage(broken, 'reveal')).toBe(ADMIN_COPY.revealError)
    expect(adminErrorMessage(broken, 'status')).toBe(ADMIN_COPY.statusError)
    expect(adminErrorMessage(broken, 'delete')).toBe(ADMIN_COPY.deleteError)
    expect(adminErrorMessage(new Error('boom'), 'delete')).toBe(ADMIN_COPY.deleteError)
    expect(adminErrorMessage(undefined, 'role')).toBe(ADMIN_COPY.roleError)
  })
})

describe('emailBreakParts', () => {
  it('breaks a long address after the @ and before each dot, never inside a word', () => {
    expect(emailBreakParts('helpful.moderator.account@example.com')).toEqual({
      local: ['helpful', '.moderator', '.account'],
      domain: ['example', '.com'],
    })
  })

  it('keeps every character, in order', () => {
    for (const address of ['helpful.moderator.account@example.com', 'a.b@mail.example.co.uk', 'n***@g***.com', 'x@y']) {
      const { local, domain } = emailBreakParts(address)
      expect(local.join('') + (domain === null ? '' : `@${domain.join('')}`)).toBe(address)
    }
  })

  it('splits a masked address the same way', () => {
    expect(emailBreakParts('n***@g***.com')).toEqual({ local: ['n***'], domain: ['g***', '.com'] })
  })

  it('leaves a word with no dot whole, for overflow-wrap to break only if it must', () => {
    expect(emailBreakParts('averyveryverylonglocalpartwithoutanydots@x.io')).toEqual({
      local: ['averyveryverylonglocalpartwithoutanydots'],
      domain: ['x', '.io'],
    })
  })

  it('splits a domain of several labels before each dot', () => {
    expect(emailBreakParts('a@mail.example.co.uk').domain).toEqual(['mail', '.example', '.co', '.uk'])
  })

  it('splits at the last @', () => {
    expect(emailBreakParts('"a@b"@example.com')).toEqual({ local: ['"a@b"'], domain: ['example', '.com'] })
  })

  it('handles text with no @, or nothing either side of it', () => {
    expect(emailBreakParts('***')).toEqual({ local: ['***'], domain: null })
    expect(emailBreakParts('name@')).toEqual({ local: ['name'], domain: [] })
    expect(emailBreakParts('@example.com')).toEqual({ local: [], domain: ['example', '.com'] })
  })

  it('keeps leading and repeated dots with the piece after them', () => {
    expect(emailBreakParts('.first..second@x.com').local).toEqual(['.first', '.', '.second'])
  })
})
