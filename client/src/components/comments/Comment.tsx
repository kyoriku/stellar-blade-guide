import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MessageSquare, Pencil, Trash2, User, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import CommentForm from './CommentForm'
import ConfirmModal from '../ConfirmModal'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface CommentData {
  id: number
  content_type: string
  content_id: number
  contentName?: string
  parent_id: number | null
  body: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  user: { id: number; username: string; avatar_url: string | null; role: string } | null
  replies?: CommentData[]
}

interface CommentProps {
  comment: CommentData
  contentType: string
  contentId: number
  contentName?: string
  onReplyPosted: (reply: CommentData, parentId: number) => void
  onEdited: (updated: CommentData) => void
  onDeleted: (id: number) => void
  depth?: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function Comment({
  comment,
  contentType,
  contentId,
  contentName,
  onReplyPosted,
  onEdited,
  onDeleted,
  depth = 0,
}: CommentProps) {
  const { user, authFetch } = useAuth()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [showReplies, setShowReplies] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isOwner = user?.id === comment.user?.id
  const isMod = user?.role === 'moderator' || user?.role === 'admin'
  const canModify = isOwner || isMod
  const hasReplies = comment.replies && comment.replies.length > 0

  const handleReply = async (body: string) => {
    const res = await authFetch(`${API_BASE_URL}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ content_type: contentType, content_id: contentId, parent_id: comment.id, body, content_name: contentName }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Failed to post reply')
    }
    const reply: CommentData = await res.json()
    onReplyPosted(reply, comment.id)
    setShowReplyForm(false)
  }

  const handleEdit = async () => {
    const trimmed = editBody.trim()
    if (!trimmed || trimmed === comment.body) { setIsEditing(false); return }
    const res = await authFetch(`${API_BASE_URL}/comments/${comment.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ body: trimmed }),
    })
    if (!res.ok) throw new Error('Failed to edit comment')
    const updated: CommentData = await res.json()
    onEdited(updated)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/comments/${comment.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setShowDeleteModal(false)
      onDeleted(comment.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={depth > 0 ? 'pl-4 border-l border-gray-800' : ''}>
      <div className="py-4">
        {/* Author row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-cyan-400/20 border border-cyan-400/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {comment.user?.avatar_url
              ? <img src={comment.user.avatar_url} alt={comment.user.username} className="w-full h-full object-cover" />
              : <User className="w-3.5 h-3.5 text-cyan-400" />
            }
          </div>
          <span className="text-sm font-medium text-gray-200">
            {comment.user?.username ?? '[deleted]'}
          </span>
          {comment.user?.role && comment.user.role !== 'user' && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              {comment.user.role}
            </span>
          )}
          <span className="text-xs text-gray-500 ml-auto">{timeAgo(comment.created_at)}</span>
        </div>

        {/* Body */}
        {comment.is_deleted ? (
          <p className="text-gray-500 text-sm italic">[deleted]</p>
        ) : isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full px-3.5 py-3 rounded-xl bg-primary border border-gray-700 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors text-sm resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={!editBody.trim() || editBody.trim() === comment.body}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/30 disabled:cursor-not-allowed text-black font-semibold text-sm transition-all cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.body}</p>
        )}

        {/* Actions */}
        {!comment.is_deleted && !isEditing && (
          <div className="flex items-center gap-3 mt-2">
            {depth === 0 && (
              <button
                onClick={() => {
                  if (!user) {
                    navigate(`/login`, { state: { from: location.pathname } })
                    return
                  }
                  setShowReplyForm(p => !p)
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Reply
              </button>
            )}

            {canModify && (
              <>
                {isOwner && (
                  <button
                    onClick={() => { setIsEditing(true); setEditBody(comment.body) }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </>
            )}

            {hasReplies && (
              <button
                onClick={() => setShowReplies(p => !p)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors ml-auto cursor-pointer"
              >
                {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        )}

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              onSubmit={handleReply}
              placeholder={`Reply to ${comment.user?.username ?? 'comment'}...`}
              buttonLabel="Reply"
              autoFocus
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {hasReplies && showReplies && (
        <div className="space-y-0">
          {comment.replies!.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              contentType={contentType}
              contentId={contentId}
              contentName={contentName}
              onReplyPosted={onReplyPosted}
              onEdited={onEdited}
              onDeleted={onDeleted}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete comment"
        message="This comment will be removed. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={isDeleting}
      />
    </div>
  )
}