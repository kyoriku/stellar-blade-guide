// A large programmatic scroll landing while the iOS soft keyboard is still
// animating away makes the fixed navbar vanish and slide back: Safari is
// re-anchoring it against a visual viewport that is still moving. Picking a
// search result does exactly that — the drawer going inert blurs the input one
// commit before the page's hash effect scrolls, so the jump lands mid-animation.

// iOS also shrinks the visual viewport by roughly 60px when the URL bar
// collapses, so the threshold has to clear that to mean "keyboard" rather than
// "toolbar". A phone keyboard takes ~300px.
const KEYBOARD_MIN_INSET = 150;
// visualViewport fires resize repeatedly through the animation, so settled means
// a quiet period rather than a single event.
const SETTLE_QUIET_MS = 120;
// Nothing here may be open-ended: if resize stalls mid-animation the scroll
// still has to happen.
const SETTLE_CAP_MS = 400;

/** Pure half, so the threshold is pinned by a test rather than a comment. */
export function isKeyboardOpen(layoutHeight: number, visualHeight: number): boolean {
  return layoutHeight - visualHeight >= KEYBOARD_MIN_INSET;
}

// TEMPORARY diagnostic — remove before merging. Answers whether this helper is
// waiting at all, or whether the height check has already gone false by the time
// it runs.
const t0 = performance.now();
export function kbdLog(event: string, detail: Record<string, unknown> = {}) {
  const viewport = window.visualViewport;
  console.log('[kbd]', event, {
    ms: Math.round(performance.now() - t0),
    innerHeight: window.innerHeight,
    visualHeight: viewport ? Math.round(viewport.height) : null,
    diff: viewport ? Math.round(window.innerHeight - viewport.height) : null,
    scrollY: Math.round(window.scrollY),
    ...detail,
  });
}

/**
 * Run `scroll` once the soft keyboard has finished animating away.
 *
 * With no keyboard up — desktop, a cold deep link, or a browser without
 * visualViewport — it runs **synchronously**, so callers in a layout effect keep
 * their pre-paint timing exactly. Returns a cancel function for effect cleanup.
 */
export function afterKeyboardSettles(scroll: () => void): () => void {
  const viewport = window.visualViewport;
  kbdLog('called', { hasViewport: !!viewport });

  if (!viewport || !isKeyboardOpen(window.innerHeight, viewport.height)) {
    kbdLog('SYNC — no keyboard detected, scrolling immediately');
    scroll();
    return () => { };
  }

  kbdLog('WAIT — keyboard detected, deferring scroll');
  let quiet: ReturnType<typeof setTimeout>;
  let resizes = 0;

  const cancel = () => {
    clearTimeout(quiet);
    clearTimeout(cap);
    viewport.removeEventListener('resize', onResize);
  };
  const finish = (reason: string) => {
    kbdLog(`FINISH via ${reason}`, { resizes });
    cancel();
    scroll();
  };
  // Every resize pushes the finish line out; the cap below bounds the total.
  const armQuiet = () => {
    clearTimeout(quiet);
    quiet = setTimeout(() => finish('quiet'), SETTLE_QUIET_MS);
  };
  const onResize = () => {
    resizes += 1;
    kbdLog('resize', { resizes });
    armQuiet();
  };

  const cap = setTimeout(() => finish('cap'), SETTLE_CAP_MS);
  viewport.addEventListener('resize', onResize);
  armQuiet();

  return () => {
    kbdLog('CANCELLED before scrolling', { resizes });
    cancel();
  };
}
