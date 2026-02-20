import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import { ApiError } from './services/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh for 10 minutes - increase to 30 minutes once content is done
      gcTime: 60 * 60 * 1000, // 1 hour - cache persists for 1 hour
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)