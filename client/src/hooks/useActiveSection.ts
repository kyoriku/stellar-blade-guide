import { useEffect, useState } from 'react';
import type { DependencyList, Dispatch, SetStateAction } from 'react';

// -80px top matches the sticky navbar height (same offset as the anchor
// scrolling in utils/toc.ts and the pages' hash-scroll effects); -80% bottom
// makes the "active" band the top fifth of the viewport.
const OBSERVER_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: '-80px 0px -80% 0px',
  threshold: 0,
};

/**
 * Scroll-spy: tracks which section is in the active band while scrolling.
 * Accepts multiple selectors observed in array order so call sites that
 * conditionally watch extra elements (CollectibleTypeDetailPage in A-Z mode)
 * keep their exact observation order. `deps` is passed through as the
 * re-observe trigger — supply whatever signals the observed DOM was rebuilt;
 * selectors are deliberately not part of it (call sites whose selectors
 * change already include the driving value, e.g. sortMode).
 */
export function useActiveSection(
  selectors: string | readonly string[],
  deps: DependencyList
): [string, Dispatch<SetStateAction<string>>] {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, OBSERVER_OPTIONS);

    const list = typeof selectors === 'string' ? [selectors] : selectors;
    list.forEach((sel) => document.querySelectorAll(sel).forEach((el) => observer.observe(el)));

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [activeSection, setActiveSection];
}
