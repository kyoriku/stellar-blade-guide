// What /login and /register say in place of their sign-in controls when the browser
// refuses site storage ('blocked') or has none ('off'). Import-free: the e2e spec
// loads it.
export const STORAGE_COPY = {
  blocked: {
    login: "Your browser is blocking cookies and site data for this site, and signing in needs them. Allow them in your browser's settings, then reload this page.",
    register: "Your browser is blocking cookies and site data for this site, and creating an account needs them. Allow them in your browser's settings, then reload this page.",
  },
  off: {
    login: "This browser doesn't let sites save data, and signing in needs that. Open this page in your usual browser to sign in.",
    register: "This browser doesn't let sites save data, and creating an account needs that. Open this page in your usual browser to create an account.",
  },
  guide: 'You can still read the guide without an account.',
} as const
