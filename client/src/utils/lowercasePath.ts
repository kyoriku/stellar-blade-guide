// Every page path is lowercase, so one with capitals is another spelling of it. The server
// answers those with a 301 (lowercase_page_path in server/app/seo_head.py); this twin covers what
// it never sees: the dev server, and a link inside the app.

// A page path: ASCII letters, digits and hyphens between single slashes.
const PAGE_PATH = /^(?:\/[A-Za-z0-9-]+)+$/

/** The lowercase spelling of a page path holding a capital, without a trailing slash, or null. */
export function lowercasePagePath(pathname: string): string | null {
  let path: string
  try {
    // Decoded whole, as the server's path is, so %45 counts as the E it is.
    path = decodeURIComponent(pathname).replace(/\/+$/, '')
  } catch {
    return null
  }
  if (!PAGE_PATH.test(path) || !/[A-Z]/.test(path)) return null
  const lower = path.toLowerCase()
  return lower === '/api' || lower.startsWith('/api/') ? null : lower
}
