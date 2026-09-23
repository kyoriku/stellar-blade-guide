// A large programmatic scroll landing while the iOS soft keyboard is still
// animating away makes the fixed navbar vanish and slide back: Safari is
// re-anchoring it against a visual viewport that is still moving. Picking a
// search result does exactly that — the drawer going inert blurs the input one
// commit before the page's hash effect scrolls, so the jump lands mid-animation.

// Measured on iPhone Safari: innerHeight is 714 throughout, visualHeight is 377
// with the keyboard up (diff 337) and exactly 714 at rest (diff 0). 150 sits
// between with margin either way.
//
// Deliberately not tightened to match that exact-zero resting diff. Those
// numbers come from Safari, because that is what Web Inspector can attach to,
// while the symptom is only visible in Chrome for iOS — which draws its own
// toolbar and may well rest at a non-zero inset. A tolerant threshold reads
// both as "keyboard gone"; an exact one would only be right on the browser we
// could measure.
const KEYBOARD_MIN_INSET = 150;
// Small grace after the height comes back, in case the metrics lead the
// compositor by a frame.
const SETTLE_GRACE_MS = 60;
// Nothing here may be open-ended. Sized from measured runs: blur at 0ms, the
// dismissal had still not started at 189ms, and the height was back before
// 540ms. This is the fallback for a viewport that never reports returning — a
// plain delay in all but name — not the normal path.
const SETTLE_CAP_MS = 800;

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
  let grace: ReturnType<typeof setTimeout> | undefined;
  let resizes = 0;

  const cancel = () => {
    clearTimeout(grace);
    clearTimeout(cap);
    viewport.removeEventListener('resize', onResize);
  };
  const finish = (reason: string) => {
    kbdLog(`FINISH via ${reason}`, { resizes });
    cancel();
    scroll();
  };
  // Wait for the height to come BACK, not for a period of stillness. Measured on
  // device: iOS fires no resize at all during the dismissal — one event at the
  // end, where the height snaps back in a single step — and the animation does
  // not even begin for ~190ms after blur. So any timer armed up front expires in
  // a dead window, and "quiet" means "has not started" rather than "has settled".
  //
  // isKeyboardOpen's threshold is what makes "returned" robust to the URL bar,
  // whose inset we cannot know in advance: we never need the exact resting
  // height, only that the keyboard-sized chunk is gone.
  const onResize = () => {
    resizes += 1;
    const restored = !isKeyboardOpen(window.innerHeight, viewport.height);
    kbdLog('resize', { resizes, restored });
    if (!restored) return;
    clearTimeout(grace);
    grace = setTimeout(() => finish('restored'), SETTLE_GRACE_MS);
  };

  const cap = setTimeout(() => finish('cap'), SETTLE_CAP_MS);
  viewport.addEventListener('resize', onResize);

  return () => {
    kbdLog('CANCELLED before scrolling', { resizes });
    cancel();
  };
}
