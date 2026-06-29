import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useToast } from '../context/ToastContext'
import { readError, errorMessage } from '../services/api'

const STORAGE_KEY = 'sb_progress'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function getLocalProgress(): Set<number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function setLocalProgress(ids: Set<number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function useProgress() {
  const { isAuthenticated, isLoading: authLoading, authFetch } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Guest state
  const [guestIds, setGuestIds] = useState<Set<number>>(() => getLocalProgress())

  // Per-collectible in-flight tracking for authenticated toggles, so the UI can
  // disable a single checkbox while its POST is pending without disabling the rest.
  const [pendingIds, setPendingIds] = useState<Set<number>>(() => new Set())

  // Authenticated state via TanStack Query
  const { data: serverIds, isLoading: queryLoading, isError: loadFailed, error: loadErr } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/progress`)
      if (!res.ok) throw new Error(await readError(res, 'Failed to load progress'))
      const ids: number[] = await res.json()
      return ids
    },
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000,       // 5 minutes before refetch
    gcTime: 60 * 60 * 1000,          // keep in cache for 1 hour
  })

  // Surface a load failure instead of silently showing zero progress.
  useEffect(() => {
    if (loadFailed) showToast(errorMessage(loadErr, "Couldn't load your saved progress."))
  }, [loadFailed, loadErr, showToast])

  const completedIds = isAuthenticated
    ? new Set(serverIds ?? [])
    : guestIds

  const isLoading = authLoading || (isAuthenticated && queryLoading)

  // Authenticated toggle
  const toggleMutation = useMutation({
    mutationFn: async (collectibleId: number) => {
      const res = await authFetch(`${API_BASE_URL}/progress/${collectibleId}`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error(await readError(res, 'Failed to save progress'))
    },
    onMutate: async (collectibleId: number) => {
      await queryClient.cancelQueries({ queryKey: ['progress'] })
      const previous = queryClient.getQueryData<number[]>(['progress']) ?? []

      const next = previous.includes(collectibleId)
        ? previous.filter(id => id !== collectibleId)
        : [...previous, collectibleId]

      queryClient.setQueryData(['progress'], next)
      return { previous }
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['progress'], context.previous)
      }
      showToast(errorMessage(err, "Couldn't save your progress. Please try again."))
    },
  })

  const toggle = useCallback(async (collectibleId: number) => {
    if (isAuthenticated) {
      setPendingIds(prev => new Set(prev).add(collectibleId))
      toggleMutation.mutate(collectibleId, {
        onSettled: () => {
          setPendingIds(prev => {
            const next = new Set(prev)
            next.delete(collectibleId)
            return next
          })
        },
      })
    } else {
      setGuestIds(prev => {
        const next = new Set(prev)
        if (next.has(collectibleId)) {
          next.delete(collectibleId)
        } else {
          next.add(collectibleId)
        }
        setLocalProgress(next)
        return next
      })
    }
  }, [isAuthenticated, toggleMutation])

  const isCompleted = useCallback((id: number) => completedIds.has(id), [completedIds])
  const isToggling = useCallback((id: number) => pendingIds.has(id), [pendingIds])

  return {
    completedIds,
    isCompleted,
    isToggling,
    toggle,
    isLoading,
  }
}