import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import { ApiError } from './services/api'
import { AuthProvider } from './context/AuthContext.tsx'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)