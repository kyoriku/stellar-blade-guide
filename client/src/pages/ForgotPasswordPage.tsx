import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import SEO from '../components/SEO'
import BusyLabel from '../components/BusyLabel'
import seo from '../constants/seo.json'
import { API_BASE_URL, errorMessage, readError } from '../services/api'
import { focusIfLeftNowhere } from '../utils/focus'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [noPassword, setNoPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const noPasswordTextId = useId()
  const sentTextId = useId()
  const expiryTextId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // The button is busy rather than disabled, so a second press, or Enter in a field,
    // comes here while the first is out.
    if (isSubmitting) return
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // A refusal (a 429 from the rate limit, a 5xx) sent no email, so it must not
      // reach "Check your email"; readError gives it the same wording as every form.
      if (!res.ok) throw new Error(await readError(res, 'Something went wrong. Please try again.'))
      // Every address gets the same empty 204, so the page cannot tell a password
      // account from an unknown or deactivated one. The one exception is an account
      // that signs in with a provider: it has no password to reset, and the API says
      // so rather than let this page promise an email that will never come.
      if (res.status === 200) {
        const data = (await res.json()) as { status?: string }
        setNoPassword(data.status === 'no_password')
      }
      setSubmitted(true)
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 bg-primary flex items-center justify-center px-4 py-12">
      <SEO
        title={seo.noindex['/forgot-password'].title}
        description={seo.noindex['/forgot-password'].description}
        noindex
      />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cyan-400/10 border border-cyan-400/20 mb-4">
            <KeyRound className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Forgot password?</h1>
          <p className="text-gray-400">We'll send you a reset link</p>
        </div>

        <div className="bg-secondary border border-gray-800 rounded-xl p-6 shadow-xl">
          {submitted && noPassword ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-gray-800/60 border border-gray-700 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-6 h-6 text-gray-300" />
              </div>
              {/* Each answer's heading takes focus in place of the form, and reads out its text. */}
              <h2 ref={focusIfLeftNowhere} tabIndex={-1} aria-describedby={noPasswordTextId} className="text-gray-100 font-semibold mb-2">No password to reset</h2>
              <p id={noPasswordTextId} className="text-gray-400 text-sm">
                This email signs in with Google or Discord and has no password.
              </p>
            </div>
          ) : submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 ref={focusIfLeftNowhere} tabIndex={-1} aria-describedby={`${sentTextId} ${expiryTextId}`} className="text-gray-100 font-semibold mb-2">Check your email</h2>
              <p id={sentTextId} className="text-gray-400 text-sm">
                If an account exists for <span className="text-gray-200">{email}</span>, you'll receive a reset link within a few minutes.
              </p>
              <p id={expiryTextId} className="text-gray-400 text-xs mt-3">The link expires in 1 hour.</p>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {error && (
                <div role="alert" className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-primary border border-gray-700 text-white placeholder-gray-500 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors text-sm"
                  placeholder="you@example.com"
                />
              </div>

              {/* One box, so the live region doesn't count as the form's last row. */}
              <div>
                <button
                  type="submit"
                  // Busy rather than disabled while it sends, so it keeps focus and doesn't dim.
                  aria-busy={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 aria-busy:cursor-progress text-black font-semibold text-sm transition-all duration-200 cursor-pointer"
                >
                  <BusyLabel label="Send reset link" busy={isSubmitting} />
                </button>
                {/* The button keeps its name while busy, so the busy text is read out from here. */}
                <span className="sr-only" aria-live="polite">{isSubmitting ? 'Sending…' : ''}</span>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Remembered it?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}