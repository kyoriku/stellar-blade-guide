import { parsePath } from 'react-router-dom'
import { hashTarget } from './hashTarget'

export interface Address {
  pathname: string
  search: string
  hash: string
}

// Whether two hashes name the same id, decoded: the router holds a Greek anchor percent-encoded,
// as the browser reports it, while a search result holds it raw. Hashes that don't decode
// compare as written, and '' and '#' both name nothing.
function sameHash(a: string, b: string): boolean {
  const idA = hashTarget(a)
  const idB = hashTarget(b)
  if (idA !== null || idB !== null) return idA === idB
  return (a.length > 1 ? a : '') === (b.length > 1 ? b : '')
}

/**
 * Whether following `to` (an absolute path, as a search result holds it) leads to the address
 * already open, so the pick should replace the entry rather than add a Back step that goes
 * nowhere: the browser's path, and its query when `to` has one (a result never does, while an
 * address may carry a tracking query such as fbclid, which no page reads), with a hash naming the
 * same id; or the page itself while the router holds no hash, as after a Contents jump, which
 * rewrites the address without telling the router. Read at the moment of the pick, never during
 * render.
 */
export function isOpenAddress(to: string, router: Address, browser: Address = window.location): boolean {
  const { pathname = '/', search = '', hash = '' } = parsePath(to)
  if (pathname !== browser.pathname || (search.length > 1 && search !== browser.search)) return false
  if (sameHash(hash, browser.hash)) return true
  return hash.length <= 1 && router.hash.length <= 1
    && router.pathname === browser.pathname && router.search === browser.search
}
