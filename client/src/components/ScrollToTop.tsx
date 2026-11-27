import { useLayoutEffect, useRef } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  // The address last decided on: only a change of page or hash can scroll.
  const seen = useRef<{ pathname: string; hash: string } | null>(null);

  useLayoutEffect(() => {
    const last = seen.current;
    seen.current = { pathname, hash };
    if (last && last.pathname === pathname && last.hash === hash) return;
    // A replace on the page already open keeps the reader's place: a search pick of the page
    // itself, after Back to top, only drops the hash the router still held.
    if (last?.pathname === pathname && navigationType === NavigationType.Replace) return;
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash, navigationType]);

  return null;
}

export default ScrollToTop;
