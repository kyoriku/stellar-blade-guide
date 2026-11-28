// What the sign-in pages say in place of their controls when storage is blocked or off,
// and the toast on a guest's first checkmark that can't be saved. Import-free: the e2e
// spec loads it.
export const STORAGE_COPY = {
  blocked: {
    login: "Your browser is blocking cookies and site data for this site, and signing in needs them. Allow them in your browser's settings, then reload this page.",
    register: "Your browser is blocking cookies and site data for this site, and creating an account needs them. Allow them in your browser's settings, then reload this page.",
  },
  off: {
    login: "This browser doesn't let sites save data, and signing in needs that. Open the guide in another browser to sign in.",
    register: "This browser doesn't let sites save data, and creating an account needs that. Open the guide in another browser to create an account.",
  },
  guide: 'You can still read the guide without an account.',
  checkmarks: {
    blocked: 'Your browser is blocking cookies and site data for this site, so your checkmarks last only until you close this tab, reload it, or leave the guide.',
    off: "This browser doesn't let sites save data, so your checkmarks last only until you close this tab, reload it, or leave the guide.",
    unsaved: "Changes to your checkmarks aren't being saved, so they'll be undone when you close this tab, reload it, or leave the guide.",
  },
} as const
