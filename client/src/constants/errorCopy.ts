// The client's error sentences, one file so specs can check them word for word. Imports
// nothing: the e2e specs load it, and services/api.ts reads import.meta.env at the top.
export const NETWORK_ERROR_MESSAGE = 'You appear to be offline. Check your connection and try again.'
export const RATE_LIMIT_MESSAGE = "You're doing that too fast. Please wait a moment and try again."
export const SERVER_ERROR_MESSAGE = 'Something went wrong on our end. Please try again later.'
// A Cloudflare challenge, which only a page load can pass.
export const CHALLENGE_MESSAGE = 'Your browser needs to pass a quick security check. Reload the page, then try again.'
// The same, where a reload would lose typed text.
export const COMMENT_CHALLENGE_MESSAGE = 'Your browser needs to pass a quick security check. Copy your text, reload the page, then try again.'
