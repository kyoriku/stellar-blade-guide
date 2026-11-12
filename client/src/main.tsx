import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import { ApiError } from './services/api'
import { AuthProvider } from './context/AuthContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { captureServerHead } from './utils/serverHead'
import { lowercasePagePath } from './utils/lowercasePath'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000, // 30 minutes - data stays fresh for 30 minutes - increase to 1 hour once content is done
      gcTime: 60 * 60 * 1000, // 1 hour - cache persists for 1 hour - increase to 24 hours once content is done
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      retry: (failureCount, error) => {
        // Check if it's an ApiError and don't retry 4xx client errors
        if (error instanceof ApiError) {
          const isClientError = error.status >= 400 && error.status < 500;
          if (isClientError) {
            return false; // Don't retry 404, 429, 400, etc.
          }
        }

        // Retry network errors and 5xx server errors up to 3 times
        return failureCount < 3;
      },
    },
  },
})

// A first visit with capitals takes its lowercase path before the router reads it, as the
// server's 301 gives it, so it still opens as the typed visit it is.
const lowercase = lowercasePagePath(window.location.pathname);
if (lowercase) {
  try {
    window.history.replaceState(window.history.state, '', lowercase + window.location.search + window.location.hash);
  } catch {
    // The router starts on the address as typed; RootLayout's redirect tries again.
  }
}

// Read the injected values before the strip below discards them — the
// walkthrough detail skeleton reuses the real title instead of a placeholder.
captureServerHead();

// Server-injected head tags (server/app/seo_head.py) are for crawlers; React
// owns the head after mount. Without this, the server's <title> stays first in
// the DOM and the tab title never updates on client-side navigation.
document.querySelectorAll('head [data-seo="server"]').forEach(el => el.remove());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* The last resort, above the router; a page's crash stops at its error boundary in RootLayout. */}
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)