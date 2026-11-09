// Read out to screen readers when a link or search result to a card on a type page puts the
// filter that hid it back to All; only one filter can be set at a time. Import-free: the e2e
// spec loads it.
export const REVEAL_COPY = {
  shown: (title: string) => `Filter set to All to show ${title}${/[.!?]$/.test(title) ? '' : '.'}`,
} as const
