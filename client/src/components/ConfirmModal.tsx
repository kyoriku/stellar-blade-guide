import { useEffect } from 'react'
import { Trash2, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  error?: string | null
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}: ConfirmModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onCancel])

  // Lock body scroll. The early return is load-bearing, not tidiness: the
  // `if (!isOpen) return null` below sits AFTER this effect, and Comment is
  // recursive, so every comment and every reply on a page mounts its own closed
  // ConfirmModal and runs this. An `else` branch writing 'unset' therefore let
  // dialogs that are not open clear somebody else's lock — concretely, the nav
  // drawer's (Navbar.tsx:162, the only other writer): open the drawer on a
  // phone, let the comments query resolve, and each newly mounted Comment
  // silently unlocked the page behind it. Closed instances must touch nothing.
  //
  // Keeping overflow:hidden rather than FloatingTOC's touch-action: one gesture
  // still leaks at open, but that is a property of acquiring any lock
  // mid-gesture. This returns null while closed, so at touchstart there is no
  // element to carry touch-action and iOS has already given the scroll to the
  // document. See docs/search-drawer-findings.md.
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-secondary border border-gray-700 rounded-xl shadow-2xl p-6 animate-in">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>

        {/* Content */}
        <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">{message}</p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isLoading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}