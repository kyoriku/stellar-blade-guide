// What the login page says after the API refuses an OAuth callback. The API
// redirects to /login?oauth_error=<code>&provider=<name>; this maps that pair to
// a sentence.
//
// The parameters are never rendered. Anyone can craft a /login?oauth_error=...
// link, so both values are only ever looked up in the fixed tables below, and the
// worst a crafted link can do is show one of these sentences.
//
// The codes are deliberately coarser than the API's access-log reasons: every
// state failure is "expired", because the state check is built to say nothing
// about which part of it failed.

export type OAuthNoticeTone = 'error' | 'neutral'

export interface OAuthNotice {
  text: string
  tone: OAuthNoticeTone
}

const PROVIDER_NAMES: Record<string, string> = {
  google: 'Google',
  discord: 'Discord',
}

// `name` is a display name from PROVIDER_NAMES, or null when the provider
// parameter was missing or not one we know.
const NOTICES: Record<string, (name: string | null) => OAuthNotice> = {
  'has-password': () => ({
    text: "This email is registered with a password. Sign in with your password, or use Forgot password if you don't know it.",
    tone: 'error',
  }),
  'email-unverified': name => ({
    text: name
      ? `Your ${name} account's email address isn't verified. Verify it with ${name}, then try again.`
      : "Your account's email address isn't verified. Verify it, then try again.",
    tone: 'error',
  }),
  'email-missing': name => ({
    text: name
      ? `Your ${name} account didn't share an email address. Add one with ${name}, then try again.`
      : "Your account didn't share an email address. Add one, then try again.",
    tone: 'error',
  }),
  // Not an error: the user chose this, so it does not get the red box.
  cancelled: name => ({
    text: name ? `${name} sign-in was cancelled.` : 'Sign-in was cancelled.',
    tone: 'neutral',
  }),
  // Password login stays vague about a deactivated account. This can say it, because
  // the person has just proven who they are to the provider.
  deactivated: () => ({
    text: 'This account has been deactivated.',
    tone: 'error',
  }),
  expired: () => ({
    text: 'That sign-in attempt expired or was interrupted. Please try again.',
    tone: 'error',
  }),
  failed: name => ({
    text: name
      ? `We couldn't complete ${name} sign-in. Please try again.`
      : "We couldn't complete sign-in. Please try again.",
    tone: 'error',
  }),
}

export function oauthErrorNotice(code: string | null, provider: string | null): OAuthNotice | null {
  if (!code) return null
  const name = provider && Object.hasOwn(PROVIDER_NAMES, provider) ? PROVIDER_NAMES[provider] : null
  // An unknown code still gets the generic line, so an API that learns a new code
  // before this file does is not met with silence.
  const notice = Object.hasOwn(NOTICES, code) ? NOTICES[code] : NOTICES.failed
  return notice(name)
}
