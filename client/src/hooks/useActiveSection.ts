import { useEffect, useState } from 'react';
import type { DependencyList, Dispatch, SetStateAction } from 'react';

// Active band: 80px from the top (clears the 65px navbar) to the top fifth of
// the viewport. Jumps land at 81/97px (scroll-anchor), just inside it.
const OBSERVER_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: '-80px 0px -80% 0px',
  threshold: 0,
};

// The element the band is on: the last whose top has reached the band's lower edge, a tie
// going to the later, inner one (an A-Z card over its wrapper). '' while the band is above
// them all. Unrendered elements don't count.
function idAtBand(elements: Element[], lowerEdge: number): string {
  let found = '';
  let foundTop = -Infinity;
  for (const el of elements) {
    const { top, height } = el.getBoundingClientRect();
    if (height > 0 && top < lowerEdge && top >= foundTop) {
      found = el.id;
      foundTop = top;
    }
  }
  return found;
}

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
    const list = typeof selectors === 'string' ? [selectors] : selectors;
    const elements = list.flatMap((sel) => Array.from(document.querySelectorAll(sel)));

    let firstBatch = true;
    const observer = new IntersectionObserver((entries) => {
      let inBand = false;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
          inBand = true;
        }
      });
      if (!inBand) {
        const lowerEdge = entries[0]?.rootBounds?.bottom ?? window.innerHeight * 0.2;
        const here = idAtBand(elements, lowerEdge);
        // Above the first element nothing is lit, however the reader got there. Below it,
        // the first batch, which reports every element, puts a light left from before a
        // filter or sort where the band is.
        if (here === '' || firstBatch) setActiveSection(here);
      }
      firstBatch = false;
    }, OBSERVER_OPTIONS);

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [activeSection, setActiveSection];
}
