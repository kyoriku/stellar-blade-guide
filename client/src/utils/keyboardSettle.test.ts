import { describe, it, expect } from 'vitest'
import { isKeyboardOpen } from './keyboardSettle'

// Only the pure predicate is covered: afterKeyboardSettles needs visualViewport
// and timers, and client tests are pure logic only (no jsdom). The threshold is
// the part worth pinning — it has to sit above iOS's URL-bar inset and below a
// real keyboard, and both bounds are easy to break by nudging the number.

describe('isKeyboardOpen', () => {
  it('reads a phone keyboard as open', () => {
    // iPhone 844pt viewport, ~300pt keyboard.
    expect(isKeyboardOpen(844, 544)).toBe(true)
  })

  it('does not mistake the collapsing iOS URL bar for a keyboard', () => {
    // The toolbar shrinks the visual viewport by roughly 60px.
    expect(isKeyboardOpen(844, 784)).toBe(false)
  })

  it('reads an unchanged viewport as closed', () => {
    expect(isKeyboardOpen(844, 844)).toBe(false)
  })

  it('treats the threshold as inclusive', () => {
    expect(isKeyboardOpen(844, 694)).toBe(true)
    expect(isKeyboardOpen(844, 695)).toBe(false)
  })

  it('does not report open when the visual viewport is taller', () => {
    expect(isKeyboardOpen(844, 900)).toBe(false)
  })
})
