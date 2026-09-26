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
    if (!searchParams.get('token')) {
      void navigate('/login', { replace: true })
      return
    }

    // Read once, up front: under StrictMode both effect runs share the one
    // refresh, and a read after the first run's removal sent every dev sign-in home.
    const redirect = localStorage.getItem('oauth_redirect') || '/'
    // The redirect that landed here is the response that set the cookie, so the
    // hint goes on before the refresh: a 401 removes it again, while a transient
    // failure leaves it for focus recovery and the next load to finish the sign-in.
    localStorage.setItem(SESSION_FLAG, '1')

    void refreshToken().then((accessToken) => {
      if (accessToken) {
        localStorage.removeItem('oauth_redirect')
        void navigate(redirect, { replace: true })
        return
      }
      // A 401 has already cleared the hint and shown its toast; anything else was
      // transient with a live cookie, so say so in the login form's notice slot and
      // leave oauth_redirect for the retry to return the user.
      const transient = !!localStorage.getItem(SESSION_FLAG)
      void navigate(transient ? '/login?oauth_error=failed' : '/login', { replace: true })
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