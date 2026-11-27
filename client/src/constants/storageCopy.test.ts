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
