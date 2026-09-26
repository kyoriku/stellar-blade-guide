// Where a sign-in lands afterwards. Every writer stores the current pathname
// (the navbar's Sign in, a comment form's Sign in, the route guard), and the
// navbar renders on the auth pages too, so the stored path can be one of them:
// signed in and looking at "Create account", or /reset-password with its token
// gone from the URL. Those go home instead. The match mirrors the router's own
// (case-insensitive, trailing slashes ignored), because that is what decides
// whether a spelling renders an auth page at all.
const AUTH_PAGE = /^\/(login|register|forgot-password|reset-password|oauth\/callback)\/*$/i

export function returnPath(from: string | null | undefined): string {
  if (!from || AUTH_PAGE.test(from)) return '/'
  return from
}
