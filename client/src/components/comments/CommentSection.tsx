import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import Comment, { type CommentData } from './Comment'
import CommentForm from './CommentForm'
import { useAuth } from '../../hooks/useAuth'
import { useComments, useInvalidateComments } from '../../hooks/useComments'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

interface CommentSectionProps {
  contentType: 'walkthrough' | 'collectible' | 'level'
  contentId: number
  contentName?: string
}

export default function CommentSection({ contentType, contentId, contentName }: CommentSectionProps) {
  const { authFetch } = useAuth()
  const { data, isLoading, error } = useComments(contentType, contentId)
  const invalidateComments = useInvalidateComments()
  const [comments, setComments] = useState<CommentData[]>([])

  useEffect(() => {
    if (data) setComments(data as CommentData[])
  }, [data])

  const handlePostComment = async (body: string) => {
    const res = await authFetch(`${API_BASE_URL}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ content_type: contentType, content_id: contentId, body, content_name: contentName }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Failed to post comment')
    }
    const newComment: CommentData = await res.json()
    setComments(prev => [...prev, { ...newComment, replies: [] }])
    invalidateComments(contentType, contentId)
  }

  const handleReplyPosted = (reply: CommentData, parentId: number) => {
    setComments(prev => prev.map(c =>
      c.id === parentId
        ? { ...c, replies: [...(c.replies ?? []), reply] }
        : c
    ))
    invalidateComments(contentType, contentId)
  }

  const handleEdited = (updated: CommentData) => {
    setComments(prev => prev.map(c => {
      if (c.id === updated.id) return { ...updated, replies: c.replies }
      if (c.replies) {
        return { ...c, replies: c.replies.map(r => r.id === updated.id ? updated : r) }
      }
      return c
    }))
    invalidateComments(contentType, contentId)
  }

  const handleDeleted = (id: number) => {
    const processDeleted = (comments: CommentData[]): CommentData[] =>
      comments
        .map(c => {
          if (c.id === id) {
            const hasLiveReplies = c.replies && c.replies.some(r => !r.is_deleted)
            if (hasLiveReplies) return { ...c, is_deleted: true, body: '[deleted]', user: null }
            return null
          }
          const updatedReplies = c.replies ? processDeleted(c.replies) as CommentData[] : undefined
          const hasLiveReplies = updatedReplies && updatedReplies.some(r => !r.is_deleted)
          if (c.is_deleted && !hasLiveReplies) return null
          return { ...c, replies: updatedReplies }
        })
        .filter(Boolean) as CommentData[]
    setComments(prev => processDeleted(prev))
    invalidateComments(contentType, contentId)
  }

  const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0)

  return (
    <section className="mt-16 pt-8 border-t border-gray-800">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">
          Comments
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">({totalCount})</span>
          )}
        </h2>
      </div>

      <div className="mb-8">
        <CommentForm onSubmit={handlePostComment} />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gray-700" />
                <div className="h-4 w-24 bg-gray-700 rounded" />
                <div className="h-4 w-12 bg-gray-700/50 rounded ml-auto" />
              </div>
              <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-1" />
              <div className="h-4 bg-gray-700/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-gray-400 text-sm">Failed to load comments</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 text-sm">No comments yet. Be the first!</p>
      ) : (
        <div className="divide-y divide-gray-800/50">
          {comments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              contentType={contentType}
              contentId={contentId}
              contentName={contentName}
              onReplyPosted={handleReplyPosted}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </section>
  )
}