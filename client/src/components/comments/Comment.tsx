import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { MessageSquare, Pencil, Trash2, User, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import type { CommentData } from '../../hooks/useComments'
import { ApiError, errorMessage } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { canDeleteComment, roleRank } from '../../utils/roles'
import CommentForm from './CommentForm'
import ConfirmModal from '../ConfirmModal'
import BusyLabel from '../BusyLabel'

interface CommentProps {
  comment: CommentData
  contentType: string
  contentId: number
  onReply: (parentId: number, body: string) => Promise<void>
  onEdit: (commentId: number, body: string) => Promise<void>
  onDelete: (commentId: number) => Promise<void>
  // Takes focus once a delete, or a refusal, takes away the Delete button that had it.
  headingRef: RefObject<HTMLHeadingElement | null>
  depth?: number
  highlightId?: number | null
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

// True when focus is on nothing, on the page itself, or on `leaving`, a control about to
// go: moving it then costs no one their place.
function focusLeftNowhere(leaving?: Element | null): boolean {
  const active = document.activeElement
  return !active || active === document.body || active === leaving
}

export default function Comment({
  comment,
  contentType,
  contentId,
  onReply,
  onEdit,
  onDelete,
  headingRef,
  depth = 0,
  highlightId = null,
}: CommentProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [editError, setEditError] = useState<string | null>(null)
  const [showReplies, setShowReplies] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  // Read when a delete settles: the browser may have closed the dialog meanwhile.
  const deleteModalOpen = useRef(false)
  // Where focus goes after the dialog follows the outcome. A cancel or a failed
  // delete gives it back to the Delete button, unless the server refused it
  // (below). A successful delete takes that button with the comment's actions,
  // so the heading gets it once both the dialog's close and the list's update
  // have landed: the list updates on TanStack's timer, in no fixed order with
  // the close.
  const deleted = useRef(false)
  const dialogGone = useRef(false)
  const listUpdated = useRef(false)
  // A refused delete takes the Delete button away too: the refusal's session refresh
  // or thread reload shows the viewer can't delete this comment after all. It holds
  // until the dialog opens again: a later failure in the same dialog doesn't bring
  // the button back.
  const refused = useRef(false)
  const focusHeadingOnceDeleted = useCallback(() => {
    if (!deleted.current || !dialogGone.current || !listUpdated.current) return
    // Only when the delete left focus nowhere: anyone who moved on meanwhile keeps their place.
    if (!focusLeftNowhere(deleteButtonRef.current)) return
    // preventScroll: the heading can be a long way up a thread.
    headingRef.current?.focus({ preventScroll: true })
  }, [headingRef])
  // The list's update reaches this comment one of two ways: a soft delete
  // re-renders it as deleted, and a hard removal unmounts it.
  useEffect(() => {
    if (!comment.is_deleted || !deleted.current) return
    listUpdated.current = true
    focusHeadingOnceDeleted()
  }, [comment.is_deleted, focusHeadingOnceDeleted])
  useEffect(() => () => {
    if (!deleted.current) return
    listUpdated.current = true
    focusHeadingOnceDeleted()
  }, [focusHeadingOnceDeleted])
  const [isSaving, setIsSaving] = useState(false)
  // Focus follows the edit: into the text box, caret at the end, when it opens, and back
  // to Edit once Cancel or a save closes it. Each takes away the control that had focus.
  const editorRef = useRef<HTMLDivElement>(null)
  const editBoxRef = useRef<HTMLTextAreaElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const editClosed = useRef(false)
  // Whether the editor was on screen as it closed. If not, the reader scrolled away
  // while a save was out, and giving focus back mustn't scroll them to it.
  const editorOnScreen = useRef(true)
  useEffect(() => {
    if (isEditing) {
      const box = editBoxRef.current
      if (box) {
        box.focus()
        box.setSelectionRange(box.value.length, box.value.length)
      }
    } else if (editClosed.current) {
      editClosed.current = false
      // Not if someone moved on while a save was out.
      if (focusLeftNowhere()) editButtonRef.current?.focus({ preventScroll: !editorOnScreen.current })
    }
  }, [isEditing])
  // The reply form's Cancel gives focus back to Reply.
  const replyButtonRef = useRef<HTMLButtonElement>(null)
  const replyCancelled = useRef(false)
  useEffect(() => {
    if (showReplyForm || !replyCancelled.current) return
    replyCancelled.current = false
    replyButtonRef.current?.focus()
  }, [showReplyForm])

  // A comment whose author deleted their account arrives with user null, and a
  // guest is null too: compared bare, undefined === undefined would make a guest
  // its owner.
  const isOwner = !!comment.user && user?.id === comment.user.id
  // Edit is the author's alone; Delete follows rank (utils/roles.ts mirrors the server).
  const canDelete = canDeleteComment(user, comment.user)
  const hasReplies = comment.replies && comment.replies.length > 0

  const handleReply = async (body: string) => {
    await onReply(comment.id, body)
    setShowReplyForm(false)
  }

  const closeEdit = () => {
    const editor = editorRef.current?.getBoundingClientRect()
    editorOnScreen.current = !editor || (editor.bottom > 0 && editor.top < window.innerHeight)
    editClosed.current = true
    setIsEditing(false)
    setEditError(null)
  }
  const handleEdit = async () => {
    const trimmed = editBody.trim()
    if (!trimmed || trimmed === comment.body) { closeEdit(); return }
    setEditError(null)
    setIsSaving(true)
    try {
      await onEdit(comment.id, trimmed)
      closeEdit()
    } catch (err) {
      setEditError(errorMessage(err, 'Failed to edit comment'))
    } finally {
      setIsSaving(false)
    }
  }
  const openDeleteModal = () => {
    deleteModalOpen.current = true
    deleted.current = false
    refused.current = false
    dialogGone.current = false
    listUpdated.current = false
    setDeleteError(null)
    setShowDeleteModal(true)
  }
  const handleDialogClosed = () => {
    dialogGone.current = true
    if (deleted.current) focusHeadingOnceDeleted()
    // The refusal's session refresh or thread reload takes the Delete button away,
    // before or after this close.
    else if (refused.current) headingRef.current?.focus({ preventScroll: true })
    else if (deleteButtonRef.current) deleteButtonRef.current.focus()
    // Gone for good already: the session ended, or a refresh landed after a reopen.
    else headingRef.current?.focus({ preventScroll: true })
  }
  const closeDeleteModal = () => {
    deleteModalOpen.current = false
    setDeleteError(null)
    setShowDeleteModal(false)
  }

  const handleDelete = async () => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await onDelete(comment.id)
      deleted.current = true
      closeDeleteModal()
    } catch (err) {
      refused.current ||= err instanceof ApiError && err.status === 403
      const message = errorMessage(err, 'Failed to delete comment')
      // A dialog the browser closed mid-delete has nowhere to show the error.
      if (deleteModalOpen.current) setDeleteError(message)
      else {
        showToast(message)
        // That close gave focus back to the Delete button, which the refusal's refresh
        // or reload is about to take away.
        if (refused.current && focusLeftNowhere(deleteButtonRef.current)) {
          headingRef.current?.focus({ preventScroll: true })
        }
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      id={`comment-${comment.id}`}
      className={`scroll-mt-24 transition-[box-shadow,background-color,border-radius] duration-700 ${depth > 0 ? 'pl-4 border-l border-gray-800' : ''} ${comment.id === highlightId ? 'rounded-lg ring-2 ring-cyan-400/60 bg-cyan-500/5' : ''}`}
    >
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
          {/* Moderators and admins only, as on the admin page: a role typed by hand
              outside the three ranks as a user and gets none. */}
          {comment.user && roleRank(comment.user.role) > roleRank('user') && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              {comment.user.role}
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto mr-4">{timeAgo(comment.created_at)}</span>
        </div>

        {/* Body */}
        {comment.is_deleted ? (
          <p className="text-gray-400 text-sm italic">[deleted]</p>
        ) : isEditing ? (
          <div ref={editorRef} className="space-y-2">
              <textarea
                ref={editBoxRef}
                value={editBody}
                onChange={e => { setEditBody(e.target.value); setEditError(null) }}
                rows={3}
                maxLength={2000}
                className="w-full px-3.5 py-3 rounded-xl bg-primary border border-gray-700 text-white focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors text-sm resize-none"
              />
              <div className="flex gap-2 justify-end">
                {editError
                  ? <p className="text-red-400 text-xs my-auto mr-auto">{editError}</p>
                  : <span className="text-xs text-gray-400 my-auto mr-auto">{editBody.length}/2000</span>
                }
                <button
                  onClick={closeEdit}
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleEdit()}
                  disabled={isSaving || !editBody.trim() || editBody.trim() === comment.body || !!editError}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/30 disabled:cursor-not-allowed text-black font-semibold text-sm transition-all cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
          </div>
        ) : (
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.body}</p>
        )}

        {/* Actions */}
        {!comment.is_deleted && !isEditing && (
          <div className="flex items-center gap-3 mt-2">
            {depth === 0 && user && !showReplyForm && (
              <button
                ref={replyButtonRef}
                onClick={() => setShowReplyForm(true)}
                title="Reply to comment"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Reply
              </button>
            )}

            {canDelete && !showReplyForm && (
              <>
                {isOwner && (
                  <button
                    ref={editButtonRef}
                    onClick={() => { setIsEditing(true); setEditBody(comment.body) }}
                    title="Edit comment"
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-100 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
                <button
                  ref={deleteButtonRef}
                  // Ignored while a delete is out. If the browser closes the dialog
                  // mid-delete, this is where the delete shows until it lands.
                  onClick={() => { if (!isDeleting) openDeleteModal() }}
                  aria-busy={isDeleting}
                  title="Delete comment"
                  className="flex items-center text-xs text-gray-400 hover:text-red-400 transition-colors cursor-pointer aria-busy:cursor-progress"
                >
                  <BusyLabel
                    label="Delete"
                    busy={isDeleting ? 'Deleting…' : null}
                    variants={['Deleting…']}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    gap="gap-1"
                    align="start"
                  />
                </button>
                {/* The dialog's own announcement goes with it, so this reads out a
                    delete the browser closed the dialog on. */}
                <span className="sr-only" aria-live="polite">{isDeleting && !showDeleteModal ? 'Deleting…' : ''}</span>
              </>
            )}

            {hasReplies && (
              <button
                onClick={() => setShowReplies(p => !p)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors ml-auto mr-4 cursor-pointer"
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
              onCancel={() => { replyCancelled.current = true; setShowReplyForm(false) }}
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
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              headingRef={headingRef}
              depth={depth + 1}
              highlightId={highlightId}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation, mounted only while open */}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete comment"
          message="This comment will be removed. This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => void handleDelete()}
          onCancel={closeDeleteModal}
          // The delete, if one is out, carries on; the Delete button shows it.
          onForcedClose={closeDeleteModal}
          onClosed={handleDialogClosed}
          isLoading={isDeleting}
          error={deleteError}
        />
      )}
    </div>
  )
}