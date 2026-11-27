import { describe, expect, it } from 'vitest'
import { STORAGE_COPY } from './storageCopy'

// Word for word: the e2e spec reads these sentences from this file, so it can't see them change.
describe('the checkmark toast', () => {
  it('names how storage failed and how long checkmarks last', () => {
    expect(STORAGE_COPY.checkmarks).toEqual({
      blocked: 'Your browser is blocking cookies and site data for this site, so your checkmarks last only until you close this tab, reload it, or leave the guide.',
      off: "This browser doesn't let sites save data, so your checkmarks last only until you close this tab, reload it, or leave the guide.",
      unsaved: "Changes to your checkmarks aren't being saved, so they'll be undone when you close this tab, reload it, or leave the guide.",
    })
  })
})

describe('the sign-in notice', () => {
  it('sends a browser with no storage to another browser, and a blocked one to its settings', () => {
    expect(STORAGE_COPY.off).toEqual({
      login: "This browser doesn't let sites save data, and signing in needs that. Open the guide in another browser to sign in.",
      register: "This browser doesn't let sites save data, and creating an account needs that. Open the guide in another browser to create an account.",
    })
    expect(STORAGE_COPY.blocked).toEqual({
      login: "Your browser is blocking cookies and site data for this site, and signing in needs them. Allow them in your browser's settings, then reload this page.",
      register: "Your browser is blocking cookies and site data for this site, and creating an account needs them. Allow them in your browser's settings, then reload this page.",
    })
  })
})
