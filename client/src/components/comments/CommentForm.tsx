import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Send } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface CommentFormProps {
  onSubmit: (body: string) => Promise<void>
  placeholder?: string
  buttonLabel?: string
  autoFocus?: boolean
  onCancel?: () => void
}

export default function CommentForm({
  onSubmit,
  placeholder = 'Share your thoughts, tips, or questions...',
  buttonLabel = 'Post comment',
  autoFocus = false,
  onCancel,
}: CommentFormProps) {
  const { isAuthenticated } = useAuth()
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center gap-2 py-5 px-4 rounded-xl border border-gray-800 bg-secondary/50 text-gray-300 text-sm">
        <Link 
          to="/login" 
          state={{ from: location.pathname }} 
          className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
          Sign in
        </Link>
        <span>or</span>
        <Link 
          to="/register" 
          state={{ from: location.pathname }} 
          className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
          create an account
        </Link>
        <span>to leave a comment</span>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit(trimmed)
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={3}
        maxLength={2000}
        className="w-full px-3.5 py-3 rounded-xl bg-primary border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors text-sm resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{body.length}/2000</span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !body.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-black font-semibold text-sm transition-all duration-200 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Posting...' : buttonLabel}
          </button>
        </div>
      </div>
    </form>
  )
}