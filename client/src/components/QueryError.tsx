import { ApiError } from '../services/api'
import ErrorPage from '../pages/ErrorPage'

/**
 * Full-page error UI for a TanStack Query failure: the offline notice for a fetch that
 * rejected, a generic page for a body that couldn't be read, Security Check for a challenge,
 * otherwise an ErrorPage for the status. A 4xx shows its message (the API's own words, or the
 * call's fallback for an answer that isn't the API's); the API's own 404 and every 5xx get
 * ErrorPage's defaults (and never leak internals).
 */
export default function QueryError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry?: () => void
}) {
  if (error instanceof TypeError) {
    return <ErrorPage offline onRetry={onRetry} />
  }
  if (!(error instanceof ApiError)) {
    return <ErrorPage code={null} onRetry={onRetry} />
  }
  // Only a page load passes a challenge. Never reload on its own: a challenge on /api alone would loop.
  if (error.challenged) {
    return <ErrorPage code={null} title="Security Check" message={error.message} onRetry={() => window.location.reload()} />
  }
  // A 404 the API didn't send says nothing about the page.
  const code = error.status === 404 && !error.fromServer ? null : error.status
  const useServerMessage = code !== 404 && error.status < 500
  return (
    <ErrorPage
      code={code}
      message={useServerMessage ? error.message : undefined}
      onRetry={onRetry}
    />
  )
}
