/**
 * Scroll the window so `el` sits its own scroll-margin-top below the viewport
 * top. window.scrollTo ignores scroll-margin, so it is read back from the
 * computed style: the offset lives only in the `scroll-anchor` utility
 * (index.css), never in a caller.
 */
export function scrollToElement(el: Element) {
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const top = el.getBoundingClientRect().top + window.scrollY - margin;
  window.scrollTo({ top, behavior: 'instant' });
}
