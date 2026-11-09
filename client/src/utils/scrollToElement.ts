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

/**
 * Land a level or type page's hash target. A section's first card takes its section along,
 * so the "Level · Location" heading above it, outside the card, stays in view; anything else
 * lands itself. A-Z's one section has no heading, so its first card lands the same either way.
 */
export function scrollToCard(el: Element) {
  const section = el.closest('section[id]');
  scrollToElement(section?.querySelector('article') === el ? section : el);
}
