// The server injects the real <title> for a walkthrough detail page
// (server/app/seo_head.py), and main.tsx strips every [data-seo="server"] node
// before React mounts. Capturing the title first lets the loading skeleton show
// the real heading instead of the mission-type placeholder, so the tab title
// stops cycling real -> generic -> real. No extra request: these bytes are
// already in the document.
//
// render_head emits <title> first, so document.title already holds the server
// value at boot and entities arrive decoded — no querySelector needed.

const SITE_SUFFIX = ' | Stellar Blade Guide';
const PAGE_SUFFIX = ' Walkthrough';

// Named apart from the parameters below so the pure functions cannot
// accidentally close over this mutable state.
let capturedTitle: string | null = null;
let capturedPath: string | null = null;

/** Record the server-injected head values. MUST run before main.tsx's strip. */
export function captureServerHead(): void {
  capturedTitle = document.title || null;
  capturedPath = window.location.pathname;
}

/** Peel a server-rendered <title> down to the bare walkthrough title. */
function peelServerTitle(raw: string | null, typeDisplay: string): string | null {
  if (!raw || !raw.endsWith(SITE_SUFFIX)) return null;
  const page = raw.slice(0, -SITE_SUFFIX.length);
  // Rejects the 404 head and the list page, whose plural "Walkthroughs" fails.
  if (!page.endsWith(PAGE_SUFFIX)) return null;
  const title = page.slice(0, -PAGE_SUFFIX.length).trim();
  // A bare mission-type name is seo_head's DB-unavailable variant, not a row.
  return title && title !== typeDisplay ? title : null;
}

/**
 * The whole decision, with boot state passed in so it stays pure and testable
 * without a DOM. Returns null for every case the captured title cannot be
 * trusted; callers fall back to the mission-type placeholder.
 */
export function resolveServerTitle(
  bootTitle: string | null,
  bootPath: string | null,
  pathname: string,
  typeDisplay: string,
): string | null {
  // Stale after any client-side navigation away from the booted document.
  if (!bootPath || bootPath !== pathname) return null;
  // A mixed-case detail URL 404s on the client but still resolves a real head
  // on the server, so lifting it would flash a real <h1> before ErrorPage.
  if (bootPath !== bootPath.toLowerCase()) return null;
  return peelServerTitle(bootTitle, typeDisplay);
}

/** resolveServerTitle bound to the state captureServerHead recorded. */
export function serverWalkthroughTitle(pathname: string, typeDisplay: string): string | null {
  return resolveServerTitle(capturedTitle, capturedPath, pathname, typeDisplay);
}
