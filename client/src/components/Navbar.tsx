import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, Search, LogIn, User, LogOut, Settings, BarChart3 } from 'lucide-react'
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
import { kbdLog, sampleViewportFrames } from '../utils/keyboardSettle'
import MobileAccordionSection from './navbar/MobileAccordionSection'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchScrolled, setSearchScrolled] = useState(false);
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  // const navigate = useNavigate();
  const { user, isAuthenticated, isRestoring, logout } = useAuth();
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
  const handleLogout = async () => {
    setUserDropdownOpen(false)
    await logout()
    // navigate('/')
  }

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
    const handleMobileScroll = () => {
      if (mobileMenuRef.current) {
        setSearchScrolled(mobileMenuRef.current.scrollTop > 20);
      }
    };

    const menuElement = mobileMenuRef.current;
    if (menuElement) {
      menuElement.addEventListener('scroll', handleMobileScroll);
      return () => menuElement.removeEventListener('scroll', handleMobileScroll);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setSearchQuery('');
    if (!searchQueryRef.current) {
      setOpenSections(getActiveSectionFromPath(location.pathname));
    }
  }, [location]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchInputRef.current?.focus(), 300);
    } else {
      document.body.style.overflow = 'unset';
      setSearchScrolled(false);
      if (!searchQuery) {
        setOpenSections(getActiveSectionFromPath(location.pathname));
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, location.pathname, searchQuery]);

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
      {/* sticky, not fixed. 48cb2d2 made this `fixed` to stop a flash on large
          instant jumps, and it did — but a fixed bar is positioned against the
          layout viewport, which Chrome for iOS resizes when the soft keyboard
          opens and closes. That made the bar visibly slide whenever a keyboard
          dismissal and a big scroll landed together, which sticky never did:
          sticky positions against the scroll container, so a keyboard-driven
          viewport resize cannot move it.
          Being back in flow means no --nav-height spacer in RootLayout, and no
          inset-x-0 here — an in-flow block already spans its container. */}
      <nav className={`sticky top-0 z-50 border-b border-gray-800 transition-[background-color,box-shadow] duration-300 px-3 lg:px-0 ${scrolled
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
                <div aria-hidden className="hidden lg:flex items-center gap-2 px-2 py-1.5">
                  <div className="w-7 h-7 rounded-full bg-gray-700" />
                  <div className="w-3.5 h-3.5" />
                </div>
              ) : isAuthenticated && user ? (
                <div className="relative hidden lg:block" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(p => !p)}
                    aria-label="Account menu"
                    aria-expanded={userDropdownOpen}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/50 transition-all duration-200 text-gray-300 hover:text-cyan-400 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center overflow-hidden">
                      {user.avatar_url
                        ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        : <User className="w-4 h-4 text-cyan-400" />
                      }
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User dropdown */}
                  <div className={`absolute right-0 mt-2 w-56 bg-nav backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden transition-all duration-200 ${userDropdownOpen ? 'opacity-100 visible translate-y-0 pointer-events-auto' : 'opacity-0 invisible translate-y-2 pointer-events-none'}`}>
                    <div className="px-4 py-3 border-b border-gray-700/50 ">
                      <p className="text-sm font-medium text-white truncate">{user.username}</p>
                      {/* email isn't cached (PII) — hide the line while the
                          identity is optimistic instead of rendering a blank */}
                      {user.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
                    </div>
                    <div className="py-1.5">
                      <Link
                        to="/progress"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2 text-sm border-l-2 transition-[color,background-color] duration-200 ${location.pathname === '/progress'
                          ? 'text-cyan-400 bg-cyan-500/10 border-cyan-400 font-medium'
                          : 'text-gray-300 border-transparent hover:text-white hover:bg-gray-800/50 hover:border-gray-400'
                          }`}
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
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2 text-sm border-l-2 transition-[color,background-color] duration-200 ${location.pathname === '/settings'
                          ? 'text-cyan-400 bg-cyan-500/10 border-cyan-400 font-medium'
                          : 'text-gray-300 border-transparent hover:text-white hover:bg-gray-800/50 hover:border-gray-400'
                          }`}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={() => void handleLogout()}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm border-l-2 border-transparent text-gray-300 transition-[color,background-color] duration-200 cursor-pointer hover:text-white hover:bg-gray-800/50 hover:border-gray-400"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
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
                onClick={() => setIsOpen(!isOpen)}
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
        ref={mobileMenuRef}
        inert={!isOpen}
        className={`lg:hidden fixed left-0 right-0 bottom-0 bg-primary transition-all duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}
        // Must be the full navbar height, border included: this shares the
        // nav's z-50 and comes later in the DOM, so it paints over anything it
        // overlaps. At a hardcoded 64 it covered the nav's 1px bottom border.
        style={{ top: 'var(--nav-height)' }}
      >
        <div className="h-full flex flex-col">
          {/* Search Bar - Sticky */}
          {/* No backdrop-filter, same reasoning as the nav: unscrolled bg-primary is
              alpha-1 so the blur was invisible, and at /95 it has 5% to work with.
              Keeping a blurred layer on screen would also make the iOS flash test
              one-way. The transition covers the two paint-only properties; the
              border is left out because it toggles 0 -> 1px, and transition-all was
              animating that width as a 200ms layout jiggle. */}
          <div className={`sticky top-0 z-10 px-4 py-3 flex-shrink-0 transition-[background-color,box-shadow] duration-200 ${searchScrolled
            ? 'bg-primary/95 border-b border-gray-800 shadow-lg'
            : 'bg-primary'
            }`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                name='text'
                type="text"
                placeholder="Search collectibles, walkthroughs, levels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                // TEMPORARY diagnostic — remove before merging. Shows when the
                // input actually loses focus relative to the hash effect, and
                // samples the viewport per frame from that moment, since blur
                // is what starts the keyboard leaving.
                onFocus={() => kbdLog('input FOCUS')}
                onBlur={() => {
                  kbdLog('input BLUR');
                  sampleViewportFrames('input BLUR');
                }}
                className="w-full pl-11 pr-10 py-3 bg-secondary/50 border border-gray-600 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all text-base"
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
                  : searchQuery.length < 2
                    ? 'Type at least 2 characters...'
                    : 'Searching...'}
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto mobile-menu-scrollbar flex-1">
            <div className="space-y-1">
              {searchQuery ? (
                <div className="px-4 py-2">
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
                  // resolves in place (no bell on mobile).
                  <div aria-hidden className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 shrink-0" />
                    <div className="min-w-0 space-y-1.5">
                      <div className="h-3 w-24 rounded bg-gray-700" />
                      <div className="h-2.5 w-32 rounded bg-gray-700" />
                    </div>
                  </div>
                ) : isAuthenticated && user ? (
                  <div className="space-y-2">
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
                    <div className="flex gap-3">
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
                      <button
                        onClick={() => { setIsOpen(false); void handleLogout(); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-all duration-200 text-sm font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
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
