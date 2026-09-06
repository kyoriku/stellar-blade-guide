import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { SESSION_FLAG } from '../context/AuthContext'
import SEO from '../components/SEO';
import seo from '../constants/seo.json';

/**
 * Landing page for OAuth callbacks.
 * The backend redirects here with ?token=<access_token> after Google/Discord auth.
 * The ?token param is only a success signal and is never stored: the real access
 * token comes from POST /api/auth/refresh using the HttpOnly cookie — storing the
 * URL token would fork AuthContext's single source of truth. Then redirect back
 * to where the user came from (stored in localStorage before the OAuth redirect).
 */
export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshToken } = useAuthContext()

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      void navigate('/login', { replace: true })
      return
    }

    void refreshToken().then((token) => {
      if (token) {
        localStorage.setItem(SESSION_FLAG, '1')
      }
      const redirect = localStorage.getItem('oauth_redirect') || '/'
      localStorage.removeItem('oauth_redirect')
      void navigate(redirect, { replace: true })
    })
  }, [navigate, refreshToken, searchParams])

  return (
    <div className="min-h-main bg-primary flex items-center justify-center">
      <SEO title={seo.noindex['/oauth/callback'].title} description={seo.noindex['/oauth/callback'].description} noindex />
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Signing you in...</p>
      </div>
    </div>
  )
}