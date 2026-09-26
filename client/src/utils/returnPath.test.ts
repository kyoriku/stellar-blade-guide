import { describe, it, expect } from 'vitest'
import { returnPath } from './returnPath'

// The login page navigates here after a password sign-in and stores it for a
// provider sign-in, and every writer stores a raw pathname. The contract pinned
// here is that an auth page never comes back: the navbar's Sign in renders on
// those pages, so "/register" is an ordinary thing to have stored.

describe('returnPath', () => {
  it('sends the five auth pages home', () => {
    for (const path of ['/login', '/register', '/forgot-password', '/reset-password', '/oauth/callback']) {
      expect(returnPath(path)).toBe('/')
    }
  })

  it('matches an auth page the way the router does: any case, trailing slashes ignored', () => {
    // react-router compiles routes case-insensitively and with a trailing \/*$,
    // so these spellings render the auth page while location.pathname keeps them raw.
    expect(returnPath('/Login')).toBe('/')
    expect(returnPath('/register/')).toBe('/')
    expect(returnPath('/OAUTH/callback//')).toBe('/')
  })

  it('defaults to home when nothing was stored', () => {
    expect(returnPath(undefined)).toBe('/')
    expect(returnPath(null)).toBe('/')
    expect(returnPath('')).toBe('/')
  })

  it('passes every other path through untouched', () => {
    expect(returnPath('/levels/eidos-7')).toBe('/levels/eidos-7')
    expect(returnPath('/progress')).toBe('/progress')
    expect(returnPath('/')).toBe('/')
    // Not an auth page: the router renders the 404 page for it.
    expect(returnPath('/login-help')).toBe('/login-help')
    // Only pathnames are stored today, but a hash or search must survive if one ever is.
    expect(returnPath('/walkthroughs/main-story/eidos-7#camp')).toBe('/walkthroughs/main-story/eidos-7#camp')
  })
})
