import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { API_BASE_URL } from '../services/api'

export interface NotificationItem {
  id: number
  type: string
  actor_username: string | null // null if the actor's account was deleted
  label: string
  url: string
  content_type: string
  content_id: number
  is_read: boolean
  created_at: string
}

interface NotificationList {
  items: NotificationItem[]
  unread_count: number
}

export const NOTIFICATIONS_KEY = ['notifications'] as const

/**
 * Notifications for the signed-in user. Delivery is event-driven (no polling
 * loop): React Query refetches on tab focus (refetchOnWindowFocus) and on mount,
 * and RootLayout triggers a refetch on route change — all gated by `staleTime`
 * so rapid focus/navigation within the window collapses to a single request.
 */
export function useNotifications() {
  const { isAuthenticated, authFetch } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery<NotificationList>({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/notifications`)
      if (!res.ok) throw new Error('Failed to load notifications')
      return res.json() as Promise<NotificationList>
    },
    enabled: isAuthenticated,
    refetchOnWindowFocus: true, // override the global `false` for this query only
    staleTime: 30 * 1000,       // dedupe the stacked mount/focus/nav triggers
  })

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await authFetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PATCH' })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      await authFetch(`${API_BASE_URL}/notifications/read-all`, { method: 'POST' })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })

  return {
    items: query.data?.items ?? [],
    unreadCount: query.data?.unread_count ?? 0,
    refetch: query.refetch,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
  }
}
