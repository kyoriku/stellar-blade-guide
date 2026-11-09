import { useLayoutEffect, useRef } from 'react'
import { NavigationType, useLocation, useNavigationType, type Location } from 'react-router-dom'
import { hashTarget } from '../utils/hashTarget'
import { focusLeftNowhere } from '../utils/focus'

// The heading a link's target is named by: a card's title, or a walkthrough section's.
function landedHeading(el: HTMLElement): HTMLElement | null {
  return el.matches('article, .walkthrough-content') ? el.querySelector<HTMLElement>('h2, h3') : null
}

// A link to the address the router now holds, as the link just used is.
function isLinkTo(el: Element | null, location: Location): boolean {
  return el instanceof HTMLAnchorElement && el.origin === window.location.origin
    && el.pathname === location.pathname && el.search === location.search
    && hashTarget(el.hash) === hashTarget(location.hash)
}

/**
 * Scrolls to what the address's hash names, once per navigation (a link, the same link
 * again, Back or Forward, the first load), in the first commit where `ready` says the page's
 * content is on screen; never again for that navigation, so a refetch or a filter change
 * leaves the reader where they are. `jump` must keep its identity (a module function).
 */
export function useHashJump(ready: boolean, jump: (el: HTMLElement) => void) {
  const location = useLocation()
  const navigationType = useNavigationType()
  // The navigation handled: its location object, since a key can repeat ('default').
  const jumpedFor = useRef<Location | null>(null)

  useLayoutEffect(() => {
    if (!ready || jumpedFor.current === location) return
    jumpedFor.current = location
    const id = hashTarget(location.hash)
    if (id === null) return
    const el = document.getElementById(id)
    if (!el) return
    // A comment lands centred, where its thread centres it, so the thread's own scroll moves nothing.
    if (/^comment-\d+$/.test(id)) {
      el.scrollIntoView({ behavior: 'instant', block: 'center' })
      return
    }
    jump(el)
    // A link or search result hands focus to what it landed on, as a fragment link does, when
    // focus is on that link or nowhere. Back, Forward and a typed address leave focus alone.
    if (navigationType !== NavigationType.Pop && (focusLeftNowhere() || isLinkTo(document.activeElement, location))) {
      landedHeading(el)?.focus({ preventScroll: true })
    }
  }, [ready, location, navigationType, jump])
}
