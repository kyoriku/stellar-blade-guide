import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, Sparkles, Book, Map, Compass, Search, ChevronRight } from 'lucide-react'
import { WALKTHROUGHS, LEVELS, COLLECTIBLES } from '../constants/navigation'
import { usePrefetch } from '../hooks/usePrefetch'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchScrolled, setSearchScrolled] = useState(false);
  const [openSections, setOpenSections] = useState({
    walkthroughs: true,
    levels: false,
    collectibles: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const { prefetchLevel, prefetchCollectiblesByType, prefetchWalkthroughsByType } = usePrefetch();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [openDropdown, setOpenDropdown] = useState<null | 'walkthroughs' | 'levels' | 'collectibles'>(null);

  const handleMouseEnter = (menu: 'walkthroughs' | 'levels' | 'collectibles') => {
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  // Determine which section should be open based on current path
  const getActiveSectionFromPath = (pathname: string) => {
    if (pathname.startsWith('/levels/')) {
      return { walkthroughs: false, levels: true, collectibles: false };
    } else if (pathname.startsWith('/collectibles/')) {
      return { walkthroughs: false, levels: false, collectibles: true };
    } else {
      // Home page or walkthrough pages
      return { walkthroughs: true, levels: false, collectibles: false };
    }
  };

  const toggleSection = (section: 'walkthroughs' | 'levels' | 'collectibles') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filter items based on search query
  const filterItems = <T extends { name: string }>(items: readonly T[]): T[] => {
    if (!searchQuery.trim()) return [...items];
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredWalkthroughs = filterItems(WALKTHROUGHS);
  const filteredLevels = filterItems(LEVELS);
  const filteredCollectibles = filterItems(COLLECTIBLES);

  const totalResults = filteredWalkthroughs.length + filteredLevels.length + filteredCollectibles.length;

  // Auto-expand sections with results when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      setOpenSections({
        walkthroughs: filteredWalkthroughs.length > 0,
        levels: filteredLevels.length > 0,
        collectibles: filteredCollectibles.length > 0,
      });
    }
  }, [searchQuery, filteredWalkthroughs.length, filteredLevels.length, filteredCollectibles.length]);

  // Handle scroll in mobile menu for sticky search
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

  // Reset menu state and sections when location changes
  useEffect(() => {
    setIsOpen(false);
    setSearchQuery('');
    // Reset sections based on current location when not searching
    if (!searchQuery) {
      setOpenSections(getActiveSectionFromPath(location.pathname));
    }
  }, [location]);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
      // Auto-focus search when menu opens
      // setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'unset';
      setSearchScrolled(false);
      // Reset sections to match current location when menu closes
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

        /* Custom scrollbar for mobile menu */
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

        /* Smooth section expansion */
        .section-content {
          transition: max-height 0.3s ease-in-out, opacity 0.2s ease-in-out;
        }
      `}</style>

      <nav className={`sticky top-0 z-50 transition-all duration-300 px-3 md:px-0 ${scrolled
        ? 'bg-[rgba(1,4,9,0.9)] backdrop-blur-xl shadow-lg shadow-black/20 border-b border-gray-800'
        : 'bg-nav backdrop-blur-md border-b border-gray-800/50'
        }`}>

        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand - Enhanced */}
            <Link
              to="/"
              className="group flex items-center gap-2 text-xl font-bold text-white hover:text-blue-400 transition-all duration-300"
            >
              <div className="relative">
                <Sparkles className="w-6 h-6 text-blue-400 transition-transform duration-300 group-hover:rotate-180 group-hover:scale-110" />
                <div className="absolute inset-0 bg-blue-400 blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Stellar Blade Guide
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Walkthroughs Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('walkthroughs')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={() =>
                    setOpenDropdown(prev => (prev === 'walkthroughs' ? null : 'walkthroughs'))
                  }
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200 cursor-pointer"
                >
                  Walkthroughs
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'walkthroughs' ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {/* Hover buffer */}
                <div className="absolute left-0 top-full h-2 w-full"></div>

                <div
                  className={`absolute left-0 mt-2 w-56 bg-nav backdrop-blur-xl rounded-xl shadow-2xl border border-blue-500/30 z-50 overflow-hidden transition-all duration-200
      ${openDropdown === 'walkthroughs' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}
                >
                  <div className="py-2">
                    {WALKTHROUGHS.map((type, index) => (
                      <Link
                        key={type.slug}
                        to={`walkthroughs/${type.slug}`}
                        onClick={() => setOpenDropdown(null)}
                        onMouseEnter={() => prefetchWalkthroughsByType(type.slug)}
                        className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-transparent hover:text-white hover:border-l-2 hover:border-blue-400 transition-all duration-200"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        {type.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Levels Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('levels')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={() =>
                    setOpenDropdown(prev => (prev === 'levels' ? null : 'levels'))
                  }
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200 cursor-pointer"
                >
                  Levels
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'levels' ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {/* Hover buffer */}
                <div className="absolute left-0 top-full h-2 w-full"></div>

                <div
                  className={`absolute left-0 mt-2 w-56 bg-nav backdrop-blur-xl rounded-xl shadow-2xl border border-green-500/30 z-50 overflow-hidden transition-all duration-200
      ${openDropdown === 'levels' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}
                >
                  <div className="py-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {LEVELS.map((level, index) => {
                      const isActive = location.pathname === `/levels/${level.slug}`;
                      return (
                        <Link
                          key={level.slug}
                          to={`/levels/${level.slug}`}
                          onClick={() => setOpenDropdown(null)}
                          onMouseEnter={() => prefetchLevel(level.slug)}
                          className={`block px-4 py-2.5 text-sm transition-all duration-200 ${isActive
                            ? 'text-white bg-gradient-to-r from-green-500/20 to-transparent border-l-2 border-green-400 font-medium'
                            : 'text-gray-300 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-transparent hover:text-white hover:border-l-2 hover:border-green-400'
                            }`}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          {level.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Collectibles Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('collectibles')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={() =>
                    setOpenDropdown(prev => (prev === 'collectibles' ? null : 'collectibles'))
                  }
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200 cursor-pointer"
                >
                  Collectibles
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'collectibles' ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {/* Hover buffer */}
                <div className="absolute left-0 top-full h-2 w-full"></div>

                <div
                  className={`absolute left-0 mt-2 w-56 bg-nav backdrop-blur-xl rounded-xl shadow-2xl border border-purple-500/30 z-50 overflow-hidden transition-all duration-200
      ${openDropdown === 'collectibles' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}
                >
                  <div className="py-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {COLLECTIBLES.map((type, index) => {
                      const isActive = location.pathname === `/collectibles/${type.slug}`;
                      return (
                        <Link
                          key={type.slug}
                          to={`/collectibles/${type.slug}`}
                          onClick={() => setOpenDropdown(null)}
                          onMouseEnter={() => prefetchCollectiblesByType(type.slug)}
                          className={`block px-4 py-2.5 text-sm transition-all duration-200 ${isActive
                            ? 'text-white bg-gradient-to-r from-purple-500/20 to-transparent border-l-2 border-purple-400 font-medium'
                            : 'text-gray-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-transparent hover:text-white hover:border-l-2 hover:border-purple-400'
                            }`}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          {type.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Mobile menu button - Enhanced */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6">
                <Menu
                  className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                    }`}
                  size={24}
                />
                <X
                  className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                    }`}
                  size={24}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          style={{
            top: '64px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}

      {/* Mobile Navigation - Enhanced with Collapsible Sections */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden fixed left-0 right-0 bottom-0 bg-gray-950 transition-all duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
          }`}
        style={{ top: '64px' }}
      >
        <div className="h-full flex flex-col">
          {/* Search Bar - Sticky */}
          <div className={`sticky top-0 z-10 px-4 py-3 flex-shrink-0 transition-all duration-200 ${searchScrolled
            ? 'bg-gray-950/95 backdrop-blur-xl border-b border-gray-800 shadow-lg'
            : 'bg-gray-950'
            }`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              <input
                ref={searchInputRef}
                name='text'
                type="text"
                placeholder="Search levels, collectibles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-base"
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

            {/* Search Results Count */}
            {searchQuery && (
              <div className="mt-2 text-xs text-gray-500">
                {totalResults === 0 ? (
                  'No results found'
                ) : (
                  `${totalResults} result${totalResults !== 1 ? 's' : ''} found`
                )}
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto mobile-menu-scrollbar flex-1">
            <div className="space-y-1">
              {/* Walkthroughs Section */}
              {filteredWalkthroughs.length > 0 && (
                <div className="border-b border-gray-800/50">
                  <button
                    onClick={() => toggleSection('walkthroughs')}
                    className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-800/30 transition-colors group active:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Book className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-200 text-base block">Walkthroughs</span>
                        {searchQuery && (
                          <span className="text-xs text-gray-500">
                            {filteredWalkthroughs.length} item{filteredWalkthroughs.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openSections.walkthroughs ? 'rotate-90' : ''
                        }`}
                    />
                  </button>

                  <div
                    className={`section-content overflow-hidden ${openSections.walkthroughs ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <div className="space-y-0.5 pb-2 px-2">
                      {filteredWalkthroughs.map((type, index) => (
                        <MobileNavLink
                          key={type.slug}
                          to={`walkthroughs/${type.slug}`}
                          onClick={() => setIsOpen(false)}
                          indent
                          color="blue"
                          style={{
                            animation: openSections.walkthroughs ? `slideIn 0.3s ease-out ${index * 0.05}s both` : 'none'
                          }}
                        >
                          {type.name}
                        </MobileNavLink>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Levels Section */}
              {filteredLevels.length > 0 && (
                <div className="border-b border-gray-800/50">
                  <button
                    onClick={() => toggleSection('levels')}
                    className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-800/30 transition-colors group active:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <Map className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-200 text-base block">Levels</span>
                        {searchQuery && (
                          <span className="text-xs text-gray-500">
                            {filteredLevels.length} item{filteredLevels.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openSections.levels ? 'rotate-90' : ''
                        }`}
                    />
                  </button>

                  <div
                    className={`section-content overflow-hidden ${openSections.levels ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <div className="space-y-0.5 pb-2 px-2">
                      {filteredLevels.map((level, index) => (
                        <MobileNavLink
                          key={level.slug}
                          to={`/levels/${level.slug}`}
                          onClick={() => setIsOpen(false)}
                          onMouseEnter={() => prefetchLevel(level.slug)}
                          onTouchStart={() => prefetchLevel(level.slug)}
                          indent
                          color="green"
                          style={{
                            animation: openSections.levels ? `slideIn 0.3s ease-out ${index * 0.05}s both` : 'none'
                          }}
                        >
                          {level.name}
                        </MobileNavLink>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Collectibles Section */}
              {filteredCollectibles.length > 0 && (
                <div className="border-b border-gray-800/50">
                  <button
                    onClick={() => toggleSection('collectibles')}
                    className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-800/30 transition-colors group active:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Compass className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-200 text-base block">Collectibles</span>
                        {searchQuery && (
                          <span className="text-xs text-gray-500">
                            {filteredCollectibles.length} item{filteredCollectibles.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openSections.collectibles ? 'rotate-90' : ''
                        }`}
                    />
                  </button>

                  <div
                    className={`section-content overflow-hidden ${openSections.collectibles ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <div className="space-y-0.5 pb-2 px-2">
                      {filteredCollectibles.map((type, index) => (
                        <MobileNavLink
                          key={type.slug}
                          to={`/collectibles/${type.slug}`}
                          onClick={() => setIsOpen(false)}
                          onMouseEnter={() => prefetchCollectiblesByType(type.slug)}
                          onTouchStart={() => prefetchCollectiblesByType(type.slug)}
                          indent
                          color="purple"
                          style={{
                            animation: openSections.collectibles ? `slideIn 0.3s ease-out ${index * 0.05}s both` : 'none'
                          }}
                        >
                          {type.name}
                        </MobileNavLink>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* No results message */}
              {searchQuery && totalResults === 0 && (
                <div className="px-4 py-12 text-center">
                  <div className="inline-flex p-4 bg-gray-800/30 rounded-full mb-4">
                    <Search className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400 font-medium text-lg mb-1">No results found</p>
                  <p className="text-gray-500 text-sm">Try searching with different keywords</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface MobileNavLinkProps {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
  indent?: boolean;
  onMouseEnter?: () => void;
  onTouchStart?: () => void;
  style?: React.CSSProperties;
  color?: 'blue' | 'green' | 'purple';
}

function MobileNavLink({ to, onClick, children, indent = false, onMouseEnter, onTouchStart, style, color = 'blue' }: MobileNavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  const colorClasses = {
    blue: {
      active: 'text-white bg-gradient-to-r from-blue-600/20 to-transparent border-l-4 border-blue-400 shadow-sm',
      hover: 'text-gray-300 hover:bg-gray-800/40 hover:text-white border-l-4 border-transparent hover:border-blue-600/30 active:bg-gray-800/60'
    },
    green: {
      active: 'text-white bg-gradient-to-r from-green-600/20 to-transparent border-l-4 border-green-400 shadow-sm',
      hover: 'text-gray-300 hover:bg-gray-800/40 hover:text-white border-l-4 border-transparent hover:border-green-600/30 active:bg-gray-800/60'
    },
    purple: {
      active: 'text-white bg-gradient-to-r from-purple-600/20 to-transparent border-l-4 border-purple-400 shadow-sm',
      hover: 'text-gray-300 hover:bg-gray-800/40 hover:text-white border-l-4 border-transparent hover:border-purple-600/30 active:bg-gray-800/60'
    }
  };

  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onTouchStart={onTouchStart}
      style={style}
      className={`block py-3.5 rounded-lg font-medium transition-all duration-200 min-h-[52px] flex items-center ${indent ? 'px-8 text-[15px]' : 'px-4'
        } ${isActive ? colorClasses[color].active : colorClasses[color].hover}`}
    >
      {children}
    </Link>
  );
}

export default Navbar;