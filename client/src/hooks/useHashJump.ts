import { useLayoutEffect, useRef } from 'react'
import { useLocation, type Location } from 'react-router-dom'
import { hashTarget } from '../utils/hashTarget'

/**
 * Scrolls to what the address's hash names, once per navigation (a link, the same link
 * again, Back or Forward, the first load), in the first commit where `ready` says the page's
 * content is on screen; never again for that navigation, so a refetch or a filter change
 * leaves the reader where they are. `jump` must keep its identity (a module function).
 */
export function useHashJump(ready: boolean, jump: (el: HTMLElement) => void) {
  const location = useLocation()
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
  }, [ready, location, jump])
}
