// React Router's key for the history entry the browser is on: once a navigation starts, the
// new page's, before the router has rendered it. Contents and Back to top rewrite the address
// but keep the entry's state, so they leave it alone.
export function browserEntryKey(): string {
  const key = (window.history.state as { key?: unknown } | null)?.key
  return typeof key === 'string' ? key : 'default'
}
