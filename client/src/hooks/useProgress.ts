// import { useState, useEffect, useCallback } from 'react'
// import { useAuth } from './useAuth'

// const STORAGE_KEY = 'sb_progress'
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// function getLocalProgress(): Set<number> {
//   try {
//     const stored = localStorage.getItem(STORAGE_KEY)
//     return stored ? new Set(JSON.parse(stored)) : new Set()
//   } catch {
//     return new Set()
//   }
// }

// function setLocalProgress(ids: Set<number>) {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
// }

// export function useProgress() {
//   const { isAuthenticated, isLoading: authLoading, authFetch } = useAuth()
//   const [completedIds, setCompletedIds] = useState<Set<number>>(new Set())
//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     if (authLoading) return

//     if (!isAuthenticated) {
//       setCompletedIds(getLocalProgress())
//       setIsLoading(false)
//       return
//     }

//     const load = async () => {
//       try {
//         const res = await authFetch(`${API_BASE_URL}/progress/`)
//         if (res.ok) {
//           const ids: number[] = await res.json()
//           setCompletedIds(new Set(ids))
//         }
//       } catch {
//       } finally {
//         setIsLoading(false)
//       }
//     }
//     load()
//   }, [isAuthenticated, authLoading, authFetch])

//   const toggle = useCallback(async (collectibleId: number) => {
//     setCompletedIds(prev => {
//       const next = new Set(prev)
//       if (next.has(collectibleId)) {
//         next.delete(collectibleId)
//       } else {
//         next.add(collectibleId)
//       }

//       if (!isAuthenticated) {
//         setLocalProgress(next)
//       }

//       return next
//     })

//     if (isAuthenticated) {
//       try {
//         await authFetch(`${API_BASE_URL}/progress/${collectibleId}`, {
//           method: 'POST',
//         })
//       } catch {
//         setCompletedIds(prev => {
//           const reverted = new Set(prev)
//           if (reverted.has(collectibleId)) {
//             reverted.delete(collectibleId)
//           } else {
//             reverted.add(collectibleId)
//           }
//           if (!isAuthenticated) {
//             setLocalProgress(reverted)
//           }
//           return reverted
//         })
//       }
//     }
//   }, [isAuthenticated, authFetch])

//   const isCompleted = useCallback((id: number) => completedIds.has(id), [completedIds])

//   return {
//     completedIds,
//     isCompleted,
//     toggle,
//     isLoading,
//   }
// }









import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'

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

  // Guest state
  const [guestIds, setGuestIds] = useState<Set<number>>(() => getLocalProgress())

  // Authenticated state via TanStack Query
  const { data: serverIds, isLoading: queryLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/progress/`)
      if (!res.ok) return []
      const ids: number[] = await res.json()
      return ids
    },
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000,       // 5 minutes before refetch
    gcTime: 10 * 60 * 1000,          // keep in cache 10 minutes
  })

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
      if (!res.ok) throw new Error('Toggle failed')
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
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['progress'], context.previous)
      }
    },
  })

  const toggle = useCallback(async (collectibleId: number) => {
    if (isAuthenticated) {
      toggleMutation.mutate(collectibleId)
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

  return {
    completedIds,
    isCompleted,
    toggle,
    isLoading,
  }
}