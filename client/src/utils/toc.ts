export interface SubLink {
  href: string;
  title: string;
  id?: number;
}

export interface TocLink {
  /** Always a `#hash`; the TOCs preventDefault and scroll to it in-page. */
  mainLink: string;
  title: string;
  subLinks?: SubLink[];
}

/**
 * Scroll to an in-page anchor, replacing (not pushing) the URL hash so
 * back-button behavior is unchanged. The 80px offset clears the fixed navbar
 * (65px) with room to spare; it is a viewport offset, so it is unaffected by
 * the navbar being out of flow.
 *
 * A caller that pins the body with `position: fixed` must unpin before calling
 * this: that technique zeroes pageYOffset, leaves getBoundingClientRect stale
 * and collapses scrollHeight to the viewport, so the target is measured against
 * a document that is no longer where it was. FloatingTOC used to pin and no
 * longer does. `overflow: hidden` on the body does NOT have this problem —
 * measured, not assumed: it propagates to the viewport but still establishes a
 * scroll container, so pageYOffset, rect.top, scrollHeight and programmatic
 * scrollTo all behave normally, and a scroll performed while locked survives
 * the unlock. The mobile nav drawer locks that way and needs no ordering
 * guarantee from its callers.
 */
export function scrollToSection(href: string) {
  const element = document.getElementById(href.substring(1));
  if (element) {
    const offset = 97;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'instant'
    });

    history.replaceState(null, '', href);
  }
}
