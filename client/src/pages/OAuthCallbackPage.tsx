import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

/**
 * Landing page for OAuth callbacks.
 * The backend redirects here with ?token=<access_token> after Google/Discord auth.
 * We read the token, store it in AuthContext, clean the URL, then redirect back
 * to where the user came from (stored in localStorage before the OAuth redirect).
 */
export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshToken } = useAuthContext()

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    refreshToken().then(() => {
      const redirect = localStorage.getItem('oauth_redirect') || '/'
      localStorage.removeItem('oauth_redirect')
      navigate(redirect, { replace: true })
    })
  }, [])

  return (
    <div className="min-h-main bg-primary flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Signing you in...</p>
      </div>
    </div>
  )
}