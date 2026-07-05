import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { API_BASE_URL, readError } from '../services/api'

export interface CommentData {
  id: number
  content_type: string
  content_id: number
  parent_id: number | null
  body: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  user: { id: number; username: string; avatar_url: string | null; role: string } | null
  replies?: CommentData[]
}

export function useComments(contentType: string, contentId: number) {
  const { authFetch } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['comments', contentType, contentId] as const

  // Query
  const query = useQuery<CommentData[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/comments/${contentType}/${contentId}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(await readError(res, 'Failed to load comments'))
      return res.json()
    },
    enabled: !!contentType && !!contentId,
    staleTime: 5 * 60 * 1000,   // serve from cache for 5 min on SPA navigation
    gcTime: 60 * 60 * 1000,     // keep in memory for 1 hour — shows cached data instantly while refetching after staleTime expires
    // refetchInterval: 60 * 1000, // poll every 60s while on the page (consider enabling once we have more engagement to keep comment threads up-to-date)
  })

  // Cache helpers
  const setComments = (updater: (old: CommentData[]) => CommentData[]) => {
    queryClient.setQueryData<CommentData[]>(queryKey, (old = []) => updater(old))
  }

  // Mutations

  /**
   * Post a top-level comment. Appends the server response to the cache.
   */
  const postComment = async (body: string): Promise<void> => {
    const res = await authFetch(`${API_BASE_URL}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ content_type: contentType, content_id: contentId, body }),
    })
    if (!res.ok) {
      throw new Error(await readError(res, 'Failed to post comment'))
    }
    const newComment: CommentData = await res.json()
    setComments(prev => [...prev, { ...newComment, replies: [] }])
  }

  /**
   * Post a reply. Appends the server response into the parent comment's replies.
   */
  const postReply = async (parentId: number, body: string): Promise<void> => {
    const res = await authFetch(`${API_BASE_URL}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ content_type: contentType, content_id: contentId, parent_id: parentId, body }),
    })
    if (!res.ok) {
      throw new Error(await readError(res, 'Failed to post reply'))
    }
    const reply: CommentData = await res.json()
    setComments(prev =>
      prev.map(c => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c)
    )
  }

  /**
   * Edit a comment. Replaces the comment in the cache with the server response,
   * preserving its existing replies.
   */
  const editComment = async (commentId: number, body: string): Promise<void> => {
    const res = await authFetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ body }),
    })
    if (!res.ok) {
      throw new Error(await readError(res, 'Failed to edit comment'))
    }
    const updated: CommentData = await res.json()
    setComments(prev =>
      prev.map(c => {
        if (c.id === updated.id) return { ...updated, replies: c.replies }
        if (c.replies) return { ...c, replies: c.replies.map(r => r.id === updated.id ? updated : r) }
        return c
      })
    )
  }

  /**
   * Delete a comment. Soft-deletes if it has live replies (preserves thread
   * structure), hard-removes from cache otherwise. Collapsed deleted parents
   * with no surviving replies are also removed.
   */
  const deleteComment = async (commentId: number): Promise<void> => {
    const res = await authFetch(`${API_BASE_URL}/comments/${commentId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await readError(res, 'Failed to delete comment'))
    setComments(prev => processDeleted(prev, commentId))
  }

  return {
    ...query,
    postComment,
    postReply,
    editComment,
    deleteComment,
  }
}

// Helpers
function processDeleted(comments: CommentData[], id: number): CommentData[] {
  return comments
    .map(c => {
      if (c.id === id) {
        const hasLiveReplies = c.replies?.some(r => !r.is_deleted)
        if (hasLiveReplies) return { ...c, is_deleted: true, body: '[deleted]', user: null }
        return null
      }
      const updatedReplies = c.replies ? processDeleted(c.replies, id) : undefined
      const hasLiveReplies = updatedReplies?.some(r => !r.is_deleted)
      if (c.is_deleted && !hasLiveReplies) return null
      return { ...c, replies: updatedReplies }
    })
    .filter(Boolean) as CommentData[]
}