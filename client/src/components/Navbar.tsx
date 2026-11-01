import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, Search, LogIn, User, LogOut, Settings, BarChart3, Shield } from 'lucide-react'
import BusyLabel from './BusyLabel'
import { usePrefetch } from '../hooks/usePrefetch'
import { useAuth } from '../hooks/useAuth'
import { useSearch } from '../hooks/useSearch'
import { useUserStats, weightedFound } from '../hooks/useUserStats'
import { useProgress } from '../hooks/useProgress'
import { SearchTrigger } from './SearchTrigger'
import { SearchResults } from './SearchResults'
import NotificationBell from './NotificationBell'
import CompletionRing from './CompletionRing'
import { NAV_SECTIONS } from './navbar/navSections'
import type { NavSection } from './navbar/navSections'
import DesktopDropdown from './navbar/DesktopDropdown'
import MobileAccordionSection from './navbar/MobileAccordionSection'
import { ADMIN_COPY } from '../constants/adminCopy'
import { useMenuButton } from '../hooks/useMenuButton'

// The account menu's items: the current page's in cyan, the others lit on hover and
// on keyboard focus alike, as in the admin page's row menus (the arrows move focus
// here; outline-hidden, not outline-none, so forced colors still draws an outline,
// set inside the item, since the panel's overflow-hidden clips anything outside it).
// The current page's item already wears the highlight, so focus draws a white ring
// inside its cyan bar and turns its text white.
const accountItemClass = (current: boolean) =>
  `flex items-center gap-2.5 px-4 py-2 text-sm border-l-2 transition-[color,background-color] duration-200 ${current
    ? 'text-cyan-400 bg-cyan-500/10 border-cyan-400 font-medium focus-visible:text-white focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white'
    : 'text-gray-300 border-transparent hover:text-white hover:bg-gray-800/50 hover:border-gray-400 focus-visible:outline-hidden forced-colors:focus-visible:-outline-offset-4 focus-visible:text-white focus-visible:bg-gray-800/50 focus-visible:border-gray-400'
  }`

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openSections, setOpenSections] = useState({
    walkthroughs: false,
    levels: false,
    collectibles: false,
    upgrades: false,
    cosmetics: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  // Mirror for the navigation-reset effect below: it reads the query as it was
  // at nav time but must not re-run on every keystroke.
  const searchQueryRef = useRef(searchQuery);
  useEffect(() => { searchQueryRef.current = searchQuery }, [searchQuery]);
  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen]);
  // The address the drawer was last opened on. While a navigation is still rendering
  // (React Router renders it as a transition), that is already the new page's.
  const drawerOpenedFor = useRef<string | null>(null);
  // The account menu, on the WAI-ARIA menu button pattern (hooks/useMenuButton.ts):
  // the arrows, Home and End, Escape, Tab, and a press outside all work as in the
  // admin page's row menus.
  const accountMenu = useMenuButton();
  const closeAccountMenu = accountMenu.close;
  const location = useLocation();
  // const navigate = useNavigate();
  const { user, isAuthenticated, isRestoring, logout } = useAuth();
  // The Admin link shows for admins only; the page's route guard and the server
  // refuse everyone else anyway.
  const isAdmin = user?.role === 'admin';
  const { prefetchLevel, prefetchCollectiblesByType, prefetchWalkthroughsByType } = usePrefetch();
  // "Progress" completion ring: denominator from the stats snapshot, numerator
  // live from the progress set (quantity-weighted via the overrides map) so
  // toggles reflect immediately. Both hooks are enabled-gated on a real token,
  // so guests fire nothing. Rendered only when both have resolved — no
  // fabricated 0% during loading.
  const { data: userStats } = useUserStats();
  const { completedIds, isLoading: progressLoading } = useProgress();
  const ringReady = isAuthenticated && !progressLoading && !!userStats && userStats.total.total > 0;
  const ringFound = ringReady ? weightedFound(completedIds, userStats.quantity_overrides) : 0;
  const overallPct = ringReady ? Math.floor((ringFound / userStats.total.total) * 100) : 0;
  const { data: mobileSearchData, isPending: mobileSearchPending, isError: mobileSearchError, error: mobileSearchErrorObj } = useSearch(searchQuery);
  // Sign out shows its progress where it was pressed, the account menu or the drawer,
  // which stays open until it lands (it waits for a refresh in another tab of this
  // browser, then the request), and ignores a second press meanwhile. The menu goes
  // with the signed-in navbar; the drawer closes.
  const [signingOut, setSigningOut] = useState(false)
  const signingOutRef = useRef(false)
  const handleLogout = async () => {
    if (signingOutRef.current) return
    signingOutRef.current = true
    setSigningOut(true)
    try {
      await logout()
    } catch {
      // logout() has signed this tab out either way; only the request failed.
    } finally {
      signingOutRef.current = false
      setSigningOut(false)
      setIsOpen(false)
    }
  }

  // Focus restore target when the drawer is dismissed via the backdrop —
  // inert blurs the drawer's focused element to <body> otherwise.
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  // The desktop links, handed to the search so its input can size itself around them.
  const navLinksRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<null | 'walkthroughs' | 'levels' | 'collectibles' | 'upgrades' | 'cosmetics'>(null);

  const handleMouseEnter = (menu: 'walkthroughs' | 'levels' | 'collectibles' | 'upgrades' | 'cosmetics') => {
    setOpenDropdown(menu);
  };

  // Mobile accordion opens collapsed everywhere; only the category you're
  // currently browsing auto-expands (for sibling nav). Home, index pages, and
  // any non-category route leave every section closed — no arbitrary default.
  const getActiveSectionFromPath = (pathname: string) => {
    const closed = { walkthroughs: false, levels: false, collectibles: false, upgrades: false, cosmetics: false };
    if (pathname.startsWith('/walkthroughs/')) return { ...closed, walkthroughs: true };
    if (pathname.startsWith('/levels/')) return { ...closed, levels: true };
    if (pathname.startsWith('/collectibles/')) return { ...closed, collectibles: true };
    if (pathname.startsWith('/upgrades/')) return { ...closed, upgrades: true };
    if (pathname.startsWith('/cosmetics/')) return { ...closed, cosmetics: true };
    return closed;
  };

  // Single-open accordion: opening a section collapses any other (mirrors the
  // desktop dropdowns, where only one menu is open at a time). Tapping the
  // already-open section closes it.
  const toggleSection = (section: 'walkthroughs' | 'levels' | 'collectibles' | 'upgrades' | 'cosmetics') => {
    setOpenSections(prev => ({
      walkthroughs: false,
      levels: false,
      collectibles: false,
      upgrades: false,
      cosmetics: false,
      [section]: !prev[section],
    }));
  };

  // Derive which category is active
  const activeCategory = location.pathname.startsWith('/walkthroughs') ? 'walkthroughs'
    : location.pathname.startsWith('/levels') ? 'levels'
      : location.pathname.startsWith('/collectibles') ? 'collectibles'
        : location.pathname.startsWith('/upgrades') ? 'upgrades'
          : location.pathname.startsWith('/cosmetics') ? 'cosmetics'
            : null;

  // Resolve the prefetch function for a section from its discriminated config.
  const prefetchFor = (s: NavSection) => (slug: string) => {
    switch (s.prefetch.kind) {
      case 'walkthrough':
        prefetchWalkthroughsByType(slug);
        break;
      case 'level':
        void prefetchLevel(slug);
        break;
      case 'type':
        void prefetchCollectiblesByType(slug, s.prefetch.category);
        break;
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // A drawer opened for the page now committing (reopened while that page was still
    // rendering) already shows what it should: closing it, emptying its search or
    // resetting its sections now would undo what the reader has done in it since.
    if (isOpenRef.current && drawerOpenedFor.current === location.pathname + location.search + location.hash) return;
    setIsOpen(false);
    setSearchQuery('');
    if (!searchQueryRef.current) {
      setOpenSections(getActiveSectionFromPath(location.pathname));
    }
  }, [location]);

  const openDrawer = () => {
    const opened = window.location.pathname + window.location.search + window.location.hash;
    drawerOpenedFor.current = opened;
    // Reopened while a page chosen from it is still rendering: the location effect
    // will leave this drawer alone when that page commits, so it starts fresh for the
    // page now, as it would have after the commit.
    if (opened !== location.pathname + location.search + location.hash) {
      setSearchQuery('');
      setOpenSections(getActiveSectionFromPath(window.location.pathname));
    }
    setIsOpen(true);
  };

  // Back and Forward close the account menu at once, before the new page renders.
  // Every other page change from the menu closes it already (choosing an item, a
  // press outside, Tab), so the location effect above leaves it alone: that effect
  // runs when a navigation commits, which React Router renders as a transition, so
  // it came after any key pressed meanwhile and took down a menu reopened in that wait.
  useEffect(() => {
    const onPop = () => closeAccountMenu();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [closeAccountMenu]);

  // The lock belongs to the drawer being open and nothing else. searchQuery used
  // to be in the deps, so a 12-character query unlocked and re-locked the
  // viewport once per character.
  //
  // It matters more than it looks: the drawer is a sibling of the nav at
  // top: var(--nav-height), so the top 65px strip is uncovered, and the sticky
  // search header below is not a scroll container either — on a tall phone the
  // scroller usually has nothing to scroll, so a drag in the body reaches the
  // page too. Nothing but this holds those.
  //
  // There is deliberately no autofocus. It used to open the drawer with a
  // setTimeout focus() and never worked on iOS: WebKit gates the input session
  // on m_userIsInteracting, which is scoped to the event-dispatch frame and is
  // not forwarded through DOMTimer, so a timer-driven focus() gets a caret and
  // no keyboard. Confirmed on device. Removed rather than fixed — the keyboard
  // should not jump up on open.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Resets the accordion when the drawer closes with no query in flight — the
  // close-without-navigating case (hamburger, backdrop), which the location
  // effect above cannot see.
  //
  // searchQuery IS load-bearing in these deps, despite looking like the same
  // per-keystroke churn the effect above was split away from. Navigating from a
  // search result takes three commits: isOpen flips in the first, the pathname
  // in the second, and setSearchQuery('') is called from inside a passive effect
  // so the query only reaches '' in the third. Without searchQuery as a dep
  // nothing re-runs in that third commit and the accordion never resets —
  // navbar-search.spec.ts catches exactly this. Re-running per keystroke is
  // harmless here: the guard returns before doing anything while the drawer is
  // open. It was only the lock and the focus timer that could not afford it.
  useEffect(() => {
    if (isOpen || searchQuery) return;
    setOpenSections(getActiveSectionFromPath(location.pathname));
  }, [isOpen, location.pathname, searchQuery]);

  // A session that ends underneath an open account menu (signed out in another tab,
  // say) takes the menu down with it, so a sign-in with no page change between
  // doesn't bring it back open.
  useEffect(() => {
    if (!user) closeAccountMenu();
  }, [user, closeAccountMenu]);

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .mobile-menu-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .mobile-menu-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
        }

        .mobile-menu-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 3px;
        }

        .mobile-menu-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.7);
        }

        .section-content {
          transition: max-height 0.25s ease-in-out, opacity 0.2s ease-in-out;
        }
      `}</style>

      {/* No backdrop-filter in either state: unscrolled it was invisible behind an
          alpha-1 background, and scrolled it made no visible difference at 0.9 —
          while on iOS it had to re-sample the page behind the bar after every
          scroll, which is a candidate for the flash on large instant jumps.
          The border is constant, so it sits outside the conditional and outside the
          transition; the shadow is what marks the scrolled state. The transition
          lists only the properties that still change — transition-all was also
          animating the lg:px-0 padding on every breakpoint crossing. */}
      {/* fixed, not sticky: a sticky bar's position is derived from the scroll
          offset every frame, so on iOS it can be drawn a frame stale after a
          large instant jump — which was the flash. inset-x-0 is not optional;
          Tailwind's `fixed` sets only `position`, and without it the bar would
          shrink-to-fit its container child instead of spanning the viewport.
          Leaving flow means RootLayout carries a --nav-height spacer.
          Reverting to sticky was tried on 2026-09-23 and undone: it brings the
          flash straight back, and the separate bar-slide on search results that
          motivated it turned out to predate both positionings. Don't re-try it
          without a bisect against a build from before either — see
          docs/search-drawer-findings.md. */}
      <nav className={`fixed inset-x-0 top-0 z-50 border-b border-gray-800 transition-[background-color,box-shadow] duration-300 px-3 lg:px-0 ${scrolled
        ? 'bg-[rgba(1,4,9,0.97)] shadow-lg shadow-black/20'
        : 'bg-nav'
        }`}>

        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="group flex items-center gap-2 text-xl font-bold text-white hover:text-cyan-400 transition-all duration-300"
            >
              <img
                src="/assets/favicon/favicon.svg"
                alt="Stellar Blade Guide Logo"
                className="w-8 h-8"
              />
              <span className="lg:hidden xl:inline bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent group-hover:from-cyan-400 group-hover:to-cyan-300 transition-all duration-300">
                Stellar Blade Guide
              </span>
            </Link>

            {/* Desktop Navigation, grouped with the logo. Spread by justify-between the links
                sat between a wide logo and a narrow control cluster, off the page centre in
                a direction that flipped with the logo's width. On the left, the free space
                falls between the links and the controls, which is where the search opens. */}
            <div ref={navLinksRef} className="hidden lg:flex items-center space-x-1 ml-6 mr-auto">
              {NAV_SECTIONS.map((s) => (
                <DesktopDropdown
                  key={s.key}
                  section={s}
                  isOpen={openDropdown === s.key}
                  isActiveCategory={activeCategory === s.key}
                  pathname={location.pathname}
                  onOpen={() => handleMouseEnter(s.key)}
                  onClose={() => setOpenDropdown(null)}
                  onToggle={() => setOpenDropdown(prev => (prev === s.key ? null : s.key))}
                  prefetchItem={prefetchFor(s)}
                />
              ))}
            </div>

            {/* Auth UI */}
            <div className="flex items-center gap-1">
              <SearchTrigger onExpand={() => setOpenDropdown(null)} avoidRef={navLinksRef} />
              {isAuthenticated && user ? (
                <NotificationBell />
              ) : isRestoring ? (
                // Defensive-only window (hint present, sb_user missing/corrupt
                // — normally the cached identity renders instead): a static
                // neutral placeholder reserving the bell's exact footprint so
                // nothing shifts if the session confirms.
                <div aria-hidden className="hidden lg:flex h-10 items-center">
                  <div className="p-2"><div className="w-5 h-5 rounded bg-gray-700" /></div>
                </div>
              ) : null}
              {isRestoring ? (
                // Static placeholder mirroring the avatar button's footprint
                // EXACTLY (gap-2 + the w-3.5 chevron) — the right-anchored
                // cluster must not shift if the real avatar replaces it.
                // Keyed apart from the menu: both are divs in this slot, and
                // unkeyed React reused this chevron slot as the dropdown panel,
                // whose transition then animated it from opaque to closed in view.
                <div key="restoring" aria-hidden className="hidden lg:flex items-center gap-2 px-2 py-1.5">
                  <div className="w-7 h-7 rounded-full bg-gray-700" />
                  <div className="w-3.5 h-3.5" />
                </div>
              ) : isAuthenticated && user ? (
                <div key="account" className="relative hidden lg:block" {...accountMenu.rootProps}>
                  <button
                    type="button"
                    {...accountMenu.triggerProps}
                    aria-label="Account menu"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/50 transition-all duration-200 text-gray-300 hover:text-cyan-400 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center overflow-hidden">
                      {user.avatar_url
                        ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        : <User className="w-4 h-4 text-cyan-400" />
                      }
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${accountMenu.open ? 'rotate-180' : ''}`} />
                  </button>

                  {/* The panel stays mounted and fades; the identity header sits outside
                      the menu, which holds only the items. */}
                  <div {...accountMenu.panelProps} className={`absolute right-0 mt-2 w-56 bg-nav backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden transition-all duration-200 ${accountMenu.open ? 'opacity-100 visible translate-y-0 pointer-events-auto' : 'opacity-0 invisible translate-y-2 pointer-events-none'}`}>
                    <div className="px-4 py-3 border-b border-gray-700/50 ">
                      <p className="text-sm font-medium text-white truncate">{user.username}</p>
                      {/* email isn't cached (PII) — hide the line while the
                          identity is optimistic instead of rendering a blank */}
                      {user.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
                    </div>
                    <div {...accountMenu.menuProps} aria-label="Account menu" className="py-1.5">
                      <Link
                        to="/progress"
                        {...accountMenu.getItemProps()}
                        className={accountItemClass(location.pathname === '/progress')}
                      >
                        <BarChart3 className="w-4 h-4" />
                        Progress
                        {ringReady && (
                          <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 tabular-nums">
                            {overallPct}%
                            <CompletionRing fraction={ringFound / userStats.total.total} size={16} strokeWidth={2.5} />
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/settings"
                        {...accountMenu.getItemProps()}
                        className={accountItemClass(location.pathname === '/settings')}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          {...accountMenu.getItemProps()}
                          className={accountItemClass(location.pathname === '/admin')}
                        >
                          <Shield className="w-4 h-4" />
                          {ADMIN_COPY.navLink}
                        </Link>
                      )}
                      <button
                        type="button"
                        {...accountMenu.getItemProps(() => void handleLogout(), { keepOpen: true })}
                        aria-busy={signingOut}
                        className={`w-full cursor-pointer aria-busy:cursor-progress ${accountItemClass(false)}`}
                      >
                        <BusyLabel label="Sign out" busy={signingOut} icon={<LogOut className="w-4 h-4" />} gap="gap-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className="hidden lg:flex items-center justify-center gap-1.5 lg:w-[106px] px-4 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-all duration-200 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                ref={menuButtonRef}
                onClick={() => (isOpen ? setIsOpen(false) : openDrawer())}
                className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                <div className="relative w-6 h-6">
                  <Menu
                    aria-hidden
                    className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
                    size={24}
                  />
                  <X
                    aria-hidden
                    className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
                    size={24}
                  />
                </div>
              </button>
              {/* Sign out keeps its name while busy, so the busy text is read out from here,
                  outside the account menu and the drawer, one of which is always hidden. */}
              <span className="sr-only" aria-live="polite">{signingOut ? 'Signing out…' : ''}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => { setIsOpen(false); menuButtonRef.current?.focus(); }}
          // Starts below the navbar. At z-40 it loses to the nav either way, so
          // a mismatch here is invisible while the nav is taller than this
          // value — but it would show as a strip of bare page if the nav ever
          // got shorter. Inline rather than a class so it beats inset-0 above.
          style={{
            top: 'var(--nav-height)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}

      {/* Mobile Navigation — inert when closed: the drawer hides by transform/
          opacity (never display/visibility), so without inert its ~54 controls
          stay in the tab order and a11y tree while invisible */}
      <div
        id="mobile-menu"
        inert={!isOpen}
        className={`lg:hidden fixed left-0 right-0 bottom-0 bg-primary transition-all duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}
        // Must be the full navbar height, border included: this shares the
        // nav's z-50 and comes later in the DOM, so it paints over anything it
        // overlaps. At a hardcoded 64 it covered the nav's 1px bottom border.
        style={{ top: 'var(--nav-height)' }}
      >
        <div className="h-full flex flex-col">
          {/* Search Bar - Sticky */}
          {/* The border is unconditional: it used to appear only once a
              `searchScrolled` state went true, but that state could never become
              true — its scroll listener was bound to #mobile-menu, which has no
              overflow, while the real scroller is the sibling below. Wrong since
              the element was written, so the scrolled styling had never rendered.
              Kept as a permanent separator rather than rewired, since the search
              field wants dividing from the results either way. Solid gray-800 to
              match the accordion section dividers below it — see the note in
              MobileAccordionSection for why those are solid rather than /50.
              Nothing here changes any more, so there is no transition: the
              background is static and the shadow is gone. (The dropped
              `bg-primary/95` was doubly dead — `.bg-primary` is a hand-written
              rule in index.css, not a theme colour, so Tailwind never generated
              the /95 variant at all. The nav above hits the same thing and works
              around it with an arbitrary value, `bg-[rgba(1,4,9,0.97)]`.)
              `sticky top-0` is also inert — the scroller is this element's
              sibling, not its ancestor, so nothing ever passes underneath it —
              but it is left alone here deliberately. */}
          <div className="sticky top-0 z-10 px-4 py-3 flex-shrink-0 bg-primary border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                name='text'
                type="text"
                placeholder="Search collectibles, walkthroughs, levels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 border border-gray-600 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {searchQuery && (
              <div className="mt-2 text-xs text-gray-400">
                {mobileSearchData
                  ? `${mobileSearchData.total} result${mobileSearchData.total !== 1 ? 's' : ''} found`
                  // Trimmed, like the search itself (useSearch): "x " sends nothing.
                  : searchQuery.trim().length < 2
                    ? 'Type at least 2 characters...'
                    : 'Searching…'}
              </div>
            )}
          </div>

          {/* Scrollable Content. overscroll-contain stops a drag past either end
              chaining to the page behind — the one leak path here that has a real
              scroll boundary. It does nothing when this list fits its box, which
              on a tall phone is the common case with the accordion collapsed, so
              the body lock is still what holds those drags. Making those airtight
              needs FloatingTOC's measured touch-action treatment, which is its
              own change: pan-y on a list with nowhere to scroll hands the drag
              straight to the page. */}
          <div className="overflow-y-auto overscroll-contain mobile-menu-scrollbar flex-1">
            <div className="space-y-1">
              {searchQuery ? (
                // Closing divider matches the one under the search field and the
                // accordion sections, so the results read as a bounded block
                // rather than running into the auth section below. Mobile only —
                // desktop renders SearchResults inside its own bordered panel
                // (SearchTrigger.tsx:163), which already closes it.
                <div className="px-4 py-2 border-b border-gray-800">
                  <SearchResults
                    query={searchQuery}
                    data={mobileSearchData}
                    isLoading={mobileSearchPending}
                    isError={mobileSearchError}
                    error={mobileSearchErrorObj}
                    onResultClick={() => setIsOpen(false)}
                  />
                </div>
              ) : (
                <>
                  {NAV_SECTIONS.map((s) => (
                    <MobileAccordionSection
                      key={s.key}
                      section={s}
                      isOpen={openSections[s.key]}
                      onToggle={() => toggleSection(s.key)}
                      onNavigate={() => setIsOpen(false)}
                      prefetchItem={prefetchFor(s)}
                    />
                  ))}
                </>
              )}

              {/* Mobile Auth Section */}
              <div className="px-4 py-4">
                {isRestoring ? (
                  // Defensive-only window (hint present, no cached identity):
                  // static neutral row mirroring the signed-in shape so it
                  // resolves in place (no bell on mobile). Keyed apart from the
                  // menu for the same reason as the desktop pair above.
                  <div key="restoring" aria-hidden className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 shrink-0" />
                    <div className="min-w-0 space-y-1.5">
                      <div className="h-3 w-24 rounded bg-gray-700" />
                      <div className="h-2.5 w-32 rounded bg-gray-700" />
                    </div>
                  </div>
                ) : isAuthenticated && user ? (
                  <div key="account" className="space-y-2">
                    <div className="flex items-center gap-3 px-2 py-2">
                      <div className="w-8 h-8 rounded-full bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                          : <User className="w-4 h-4 text-cyan-400" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user.username}</p>
                        {user.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
                      </div>
                    </div>
                    {/* Four buttons don't fit one row at 320px, so an admin's become a
                        2x2 grid (flex-1 does nothing to a grid item). */}
                    <div className={isAdmin ? 'grid grid-cols-2 gap-3' : 'flex gap-3'}>
                      <Link
                        to="/progress"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-all duration-200 text-sm font-medium"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Progress
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-all duration-200 text-sm font-medium"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsOpen(false)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-all duration-200 text-sm font-medium"
                        >
                          <Shield className="w-4 h-4" />
                          {ADMIN_COPY.navLink}
                        </Link>
                      )}
                      <button
                        onClick={() => void handleLogout()}
                        aria-busy={signingOut}
                        className="flex-1 flex items-center justify-center py-3 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-all duration-200 text-sm font-medium aria-busy:cursor-progress"
                      >
                        <BusyLabel label="Sign out" busy={signingOut} icon={<LogOut className="w-4 h-4" />} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Link
                      to="/login"
                      state={{ from: location.pathname }}
                      onClick={() => setIsOpen(false)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-all duration-200 text-sm font-medium"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      state={{ from: location.pathname }}
                      onClick={() => setIsOpen(false)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all duration-200 text-sm font-medium"
                    >
                      Create account
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
