import { ApiError } from '../services/api'
import ErrorPage from '../pages/ErrorPage'

/**
 * Full-page error UI for a TanStack Query failure. Network errors (no ApiError /
 * no HTTP status) render an offline notice; otherwise an ErrorPage for the status.
 * The server's specific message is shown for actionable 4xx (e.g. 400/403/409/429);
 * 404 and 5xx fall back to ErrorPage's friendly defaults (and never leak internals).
 */
export default function QueryError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry?: () => void
}) {
  if (!(error instanceof ApiError)) {
    return <ErrorPage offline onRetry={onRetry} />
  }
  const useServerMessage = error.status !== 404 && error.status < 500
  return (
    <ErrorPage
      code={error.status}
      message={useServerMessage ? error.message : undefined}
      onRetry={onRetry}
    />
  )
}
