// useReducer(setTo, initial) is useState whose setter always applies. useState's drops a value
// equal to the last one rendered, and a render React sets aside can leave that at a value the
// screen never showed: a close set in a render that a Back then cancelled made every later close,
// a listener's, Escape's or a close button's, do nothing.
export const setTo = <T>(_: T, next: T): T => next
