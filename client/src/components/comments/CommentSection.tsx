import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import Comment from './Comment'
import CommentForm from './CommentForm'
import { useComments } from '../../hooks/useComments'

interface CommentSectionProps {
  contentType: 'walkthrough' | 'collectible' | 'level'
  contentId: number
}

export default function CommentSection({ contentType, contentId }: CommentSectionProps) {
  const {
    data: comments = [],
    isLoading,
    error,
    postComment,
    postReply,
    editComment,
    deleteComment,
  } = useComments(contentType, contentId)

  const location = useLocation()
  const [highlightId, setHighlightId] = useState<number | null>(null)
  // The navigation we've already highlighted for. location.key is unique per
  // navigation, so this lets comment mutations (which change `comments` and
  // re-run the effect) bail out — only a real navigation re-fires the highlight.
  const highlightedKey = useRef<string | null>(null)

  // Highlight on navigation to a #comment-<id> anchor — from the notification
  // bell/toast, or a directly-shared link. Waits for comments to render (the
  // `comments` dep) then scrolls + highlights once per navigation. No-op if the
  // target isn't present (deleted/collapsed) — you just land on the page.
  useEffect(() => {
    if (isLoading) return
    if (location.key === highlightedKey.current) return
    const m = location.hash.match(/^#comment-(\d+)$/)
    if (!m) return
    const el = document.getElementById(`comment-${m[1]}`)
    if (!el) return // not rendered yet; re-runs when `comments` updates
    highlightedKey.current = location.key
    el.scrollIntoView({ behavior: 'instant', block: 'center' })
    setHighlightId(Number(m[1]))
  }, [isLoading, comments, location.key, location.hash])

  // Clear the highlight a moment later — decoupled from the nav effect so a
  // comment mutation mid-highlight can't cancel or restart the timer.
  useEffect(() => {
    if (highlightId === null) return
    const t = setTimeout(() => setHighlightId(null), 2000)
    return () => clearTimeout(t)
  }, [highlightId])

  const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0)

  return (
    <section className="my-8 pt-16 border-t border-gray-800">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">
          Comments
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({totalCount})</span>
          )}
        </h2>
      </div>

      {/* Post a comment */}
      <div className="mb-8">
        <CommentForm onSubmit={postComment} />
      </div>

      {/* Comments list */}
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
              onReply={postReply}
              onEdit={editComment}
              onDelete={deleteComment}
              highlightId={highlightId}
            />
          ))}
        </div>
      )}
    </section>
  )
}