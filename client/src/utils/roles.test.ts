import { describe, it, expect } from 'vitest'
import { canDeleteComment, roleRank } from './roles'

// One for one with server/tests/test_comment_rank.py's tables.

const viewer = (role: string) => ({ id: 1, role })
const author = (role: string) => ({ id: 2, role })

describe('roleRank', () => {
  it('ranks the three roles', () => {
    expect(roleRank('user')).toBe(1)
    expect(roleRank('moderator')).toBe(2)
    expect(roleRank('admin')).toBe(3)
  })

  it('ranks anything else as a user', () => {
    // Typed by hand outside the three, and keys a plain object would find on its
    // prototype: the map holds only its own three.
    for (const role of ['Admin', 'admin ', 'mod', '', null, undefined, 'constructor', '__proto__', 'toString']) {
      expect(roleRank(role), String(role)).toBe(1)
    }
  })
})

describe('canDeleteComment', () => {
  it("follows rank on someone else's comment", () => {
    const cases: [string, string, boolean][] = [
      ['user', 'user', false],
      ['user', 'moderator', false],
      ['user', 'admin', false],
      ['moderator', 'user', true],
      ['moderator', 'moderator', false],
      ['moderator', 'admin', false],
      ['admin', 'user', true],
      ['admin', 'moderator', true],
      ['admin', 'admin', false],
    ]
    for (const [v, a, allowed] of cases) expect(canDeleteComment(viewer(v), author(a)), `${v} on ${a}`).toBe(allowed)
  })

  it('ranks a role typed by hand as a user, on either side', () => {
    const cases: [string, string, boolean][] = [
      ['mod', 'user', false],
      ['user', 'mod', false],
      ['moderator', 'mod', true],
      ['Admin', 'user', false],
      ['user', 'Admin', false],
      ['moderator', 'Admin', true],
      ['constructor', 'user', false],
      ['admin', '__proto__', true],
    ]
    for (const [v, a, allowed] of cases) expect(canDeleteComment(viewer(v), author(a)), `${v} on ${a}`).toBe(allowed)
  })

  it('lets anyone delete their own, whatever their role', () => {
    for (const role of ['user', 'moderator', 'admin', 'mod']) {
      expect(canDeleteComment({ id: 1, role }, { id: 1, role }), role).toBe(true)
    }
  })

  it("counts a comment with no author as a user's", () => {
    expect(canDeleteComment(viewer('user'), null)).toBe(false)
    expect(canDeleteComment(viewer('moderator'), null)).toBe(true)
    expect(canDeleteComment(viewer('admin'), null)).toBe(true)
  })

  it('gives a guest nothing', () => {
    for (const a of [author('user'), author('moderator'), author('admin'), null]) {
      expect(canDeleteComment(null, a)).toBe(false)
    }
  })
})
