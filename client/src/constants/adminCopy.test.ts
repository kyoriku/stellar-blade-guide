import { describe, it, expect } from 'vitest'
import { ADMIN_COPY } from './adminCopy'

// Every string the copy can produce, functions called with sample arguments.
function allStrings(): string[] {
  const out: string[] = []
  for (const value of Object.values(ADMIN_COPY)) {
    if (typeof value === 'string') out.push(value)
    else if (typeof value === 'function') {
      out.push((value as (...args: unknown[]) => string)(1, '1'), (value as (...args: unknown[]) => string)(2, '2'))
      out.push((value as (...args: unknown[]) => string)('spam_account'))
    } else out.push(...value)
  }
  return out
}

describe('ADMIN_COPY', () => {
  it('counts accounts in the singular and the plural', () => {
    expect(ADMIN_COPY.accounts(1, '1')).toBe('1 account')
    expect(ADMIN_COPY.accounts(0, '0')).toBe('0 accounts')
    expect(ADMIN_COPY.accounts(412, '412')).toBe('412 accounts')
    expect(ADMIN_COPY.accounts(1200, '1,200')).toBe('1,200 accounts')
  })

  it('counts matches in the singular and the plural', () => {
    expect(ADMIN_COPY.accountsMatch(1, '1')).toBe('1 account matches')
    expect(ADMIN_COPY.accountsMatch(3, '3')).toBe('3 accounts match')
  })

  it('names the account in every sentence about one', () => {
    expect(ADMIN_COPY.revealFor('newplayer_22')).toBe('Reveal email for newplayer_22')
    expect(ADMIN_COPY.hideFor('newplayer_22')).toBe('Hide email for newplayer_22')
    expect(ADMIN_COPY.actionsFor('helpful_mod')).toBe('Actions for helpful_mod')
    expect(ADMIN_COPY.nowModerator('helpful_mod')).toBe('helpful_mod is now a moderator.')
    expect(ADMIN_COPY.noLongerModerator('helpful_mod')).toBe('helpful_mod is no longer a moderator.')
    expect(ADMIN_COPY.isDeactivated('spam_account')).toBe('spam_account is deactivated.')
    expect(ADMIN_COPY.activeAgain('spam_account')).toBe('spam_account is active again.')
    expect(ADMIN_COPY.deleted('spam_account')).toBe('The account spam_account was deleted.')
    expect(ADMIN_COPY.deleteBody('spam_account')).toBe(
      'The account spam_account will be permanently deleted with its progress and notifications, and the text of its comments will be erased. This cannot be undone.',
    )
    expect(ADMIN_COPY.deactivateBody('spam_account')).toBe(
      "spam_account will be signed out everywhere and can't sign in until you reactivate the account.",
    )
  })

  it("builds the typed confirmation's label from the words around the username", () => {
    const [before, after] = ADMIN_COPY.deleteConfirmAround
    expect(ADMIN_COPY.deleteConfirmLabel('spam_account')).toBe('Type spam_account to confirm')
    expect(`${before}spam_account${after}`).toBe(ADMIN_COPY.deleteConfirmLabel('spam_account'))
  })

  it('has no em dash anywhere', () => {
    const strings = allStrings()
    expect(strings.length).toBeGreaterThan(50)
    for (const text of strings) expect(text, text).not.toContain('\u2014')
  })

  it('uses the ellipsis character, never three dots', () => {
    for (const text of allStrings()) expect(text, text).not.toContain('...')
    expect(ADMIN_COPY.saving.endsWith('\u2026')).toBe(true)
  })
})
