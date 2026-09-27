import { useLayoutEffect } from 'react'

// Refcounted rather than a plain set/remove: the two controls mount
// independently, so whichever unmounts first must not clear the attribute the
// other still needs.
let mounted = 0

/**
 * Marks <html> while a floating control is on screen, so the footer can clear
 * its last line of them.
 *
 * An attribute on the root rather than `:has()` on a common ancestor: WebKit
 * does not re-evaluate `:has()` when the matching element is inserted into a
 * sibling subtree after the anchor was styled, so on iOS the footer kept the
 * unpadded style even though Web Inspector listed the rule as matching.
 *
 * Layout effect, not passive: the attribute drives layout, so it has to land in
 * the commit. With a passive effect, navigating from a page with controls to a
 * short one can paint a frame with the footer still padded.
 */
export function useFloatingControl() {
  useLayoutEffect(() => {
    mounted += 1
    document.documentElement.setAttribute('data-floating-controls', '')
    return () => {
      mounted -= 1
      if (mounted === 0) document.documentElement.removeAttribute('data-floating-controls')
    }
  }, [])
}
