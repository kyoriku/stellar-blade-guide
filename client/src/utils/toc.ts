export interface SubLink {
  href: string;
  title: string;
  id?: number;
}

export interface TocLink {
  mainLink: string;
  title: string;
  subLinks?: SubLink[];
}

/**
 * Scroll to an in-page anchor, offset for the sticky navbar, replacing (not
 * pushing) the URL hash so back-button behavior is unchanged. Callers that
 * scroll-lock the body (FloatingTOC) must unlock first and defer this call
 * (e.g. via requestAnimationFrame) so the element position is measured
 * against the restored scroll state.
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
