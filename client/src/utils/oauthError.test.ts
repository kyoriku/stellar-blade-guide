import { describe, it, expect } from 'vitest'
import { oauthErrorNotice } from './oauthError'

// The login page shows these sentences after the API refuses an OAuth callback and
// redirects to /login?oauth_error=<code>&provider=<name>. Both parameters are
// attacker-writable (anyone can craft the link), so the contract pinned here is
// that they are only ever looked up, never rendered.

describe('oauthErrorNotice', () => {
  it('says nothing when there is no code', () => {
    expect(oauthErrorNotice(null, 'google')).toBeNull()
    expect(oauthErrorNotice('', 'google')).toBeNull()
  })

  it('pins the has-password sentence word for word', () => {
    // Approved copy. It sits above the password field, next to the existing
    // Forgot password link, so it needs no link of its own.
    expect(oauthErrorNotice('has-password', 'google')).toEqual({
      text: "This email is registered with a password. Sign in with your password, or use Forgot password if you don't know it.",
      tone: 'error',
    })
  })

  it('names the provider where the sentence has one', () => {
    expect(oauthErrorNotice('email-unverified', 'discord')?.text).toBe(
      "Your Discord account's email address isn't verified. Verify it with Discord, then try again.",
    )
    expect(oauthErrorNotice('email-missing', 'discord')?.text).toBe(
      "Your Discord account didn't share an email address. Add one with Discord, then try again.",
    )
    expect(oauthErrorNotice('failed', 'google')?.text).toBe("We couldn't complete Google sign-in. Please try again.")
  })

  it('keeps a cancel out of the red box', () => {
    expect(oauthErrorNotice('cancelled', 'google')).toEqual({ text: 'Google sign-in was cancelled.', tone: 'neutral' })
  })

  it('has one sentence for every state failure, which says nothing about which check failed', () => {
    expect(oauthErrorNotice('expired', 'google')).toEqual({
      text: 'That sign-in attempt expired or was interrupted. Please try again.',
      tone: 'error',
    })
  })

  it('says a deactivated account is deactivated', () => {
    expect(oauthErrorNotice('deactivated', 'google')).toEqual({
      text: 'This account has been deactivated.',
      tone: 'error',
    })
  })

  it('gives every known code an error tone except cancelled', () => {
    for (const code of ['has-password', 'email-unverified', 'email-missing', 'deactivated', 'expired', 'failed']) {
      expect(oauthErrorNotice(code, 'google')?.tone).toBe('error')
    }
  })

  it('falls back to the generic line for a code it does not know', () => {
    // The API may learn a code before this file does.
    expect(oauthErrorNotice('something-added-later', 'google')).toEqual(oauthErrorNotice('failed', 'google'))
  })

  it('drops the provider name when the provider is missing or not one it knows', () => {
    expect(oauthErrorNotice('failed', null)?.text).toBe("We couldn't complete sign-in. Please try again.")
    expect(oauthErrorNotice('failed', 'facebook')?.text).toBe("We couldn't complete sign-in. Please try again.")
    expect(oauthErrorNotice('cancelled', null)?.text).toBe('Sign-in was cancelled.')
    expect(oauthErrorNotice('email-unverified', null)?.text).not.toContain('null')
  })

  it('never echoes either parameter', () => {
    const hostile = '<img src=x onerror=alert(1)>'
    for (const code of ['has-password', 'email-unverified', 'email-missing', 'deactivated', 'cancelled', 'expired', 'failed', hostile]) {
      const notice = oauthErrorNotice(code, hostile)
      expect(notice?.text).not.toContain(hostile)
      expect(notice?.text).not.toContain('<')
    }
  })

  it('is not fooled by inherited object keys', () => {
    // A plain-object lookup would find Object.prototype members for these.
    expect(oauthErrorNotice('constructor', 'google')).toEqual(oauthErrorNotice('failed', 'google'))
    expect(oauthErrorNotice('failed', 'toString')?.text).toBe("We couldn't complete sign-in. Please try again.")
  })
})
