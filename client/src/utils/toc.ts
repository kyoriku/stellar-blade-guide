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
 * back-button behavior is unchanged. The 80px offset clears the sticky navbar
 * (65px) with room to spare; it is a viewport offset, so it is the same number
 * whether the bar is in flow or not. Any caller that scroll-locks the body must
 * unlock before calling this, or the element position is measured against a
 * pinned document — FloatingTOC no longer locks, but the constraint stands.
 */
export function scrollToSection(href: string) {
  const element = document.getElementById(href.substring(1));
  if (element) {
    const offset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'instant'
    });

    history.replaceState(null, '', href);
  }
}
