import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useCollectiblesByType } from '../hooks/useCollectibles'
import { ApiError } from '../services/api'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import TableOfContents from '../components/TableOfContents'
import CollectibleSection from '../components/CollectibleSection'
import ErrorPage from './ErrorPage'
import TableOfContentsSkeleton from '../components/TableOfContentsSkeleton'
import CollectibleSectionSkeleton from '../components/CollectibleSectionSkeleton'
import { COLLECTIBLES, UPGRADES, MATERIALS, COSMETICS } from '../constants/navigation'
import { ArrowLeft } from 'lucide-react'
import { usePrefetch } from '../hooks/usePrefetch'
import { useProgress } from '../hooks/useProgress'
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import CommentSection from '../components/comments/CommentSection'
import FloatingTOC from '../components/Floatingtoc'
import BackToTop from '../components/BackToTop'
import MobileBackToTop from '../components/MobileBackToTop'
import { TYPE_DESCRIPTIONS } from '../constants/typeDescriptions'

// Single level item type
type LevelItem = {
  type_id: number;
  level_id: number;
  level_name: string;
  level_order: number;
  locations: {
    location_id: number;
    location_name: string;
    location_order: number;
    collectibles: {
      id: number;
      title: string;
      description: any;
      display_order: number;
      cycle: string;
      quantity: number;
      types: string[];
      images: Array<{ id: number; url: string; alt: string; order: number }>;
    }[];
  }[];
};

// Array of levels
type LevelData = LevelItem[];

function CollectibleTypePage() {
  const { typeName } = useParams<{ typeName: string }>();
  const location = useLocation();

  // Detect category from URL
  const category = location.pathname.startsWith('/upgrades') ? 'upgrades'
    : location.pathname.startsWith('/materials') ? 'materials'
      : location.pathname.startsWith('/cosmetics') ? 'cosmetics'
        : 'collectibles';

  // Validate type exists
  const collectibleTypes = COLLECTIBLES.map(c => c.slug);
  const upgradeTypes = UPGRADES.map(u => u.slug);
  const materialTypes = MATERIALS.map(m => m.slug);
  const cosmeticTypes = COSMETICS.map(c => c.slug);

  const validTypes = category === 'upgrades' ? upgradeTypes
    : category === 'materials' ? materialTypes
      : category === 'cosmetics' ? cosmeticTypes
        : collectibleTypes;

  const isValidType = validTypes.some(type =>
    type.toLowerCase().replace(/\s+/g, '-') === typeName
  );

  // Pass category to hook
const { data: levelData = [] as LevelData, isLoading, isError, error } = useCollectiblesByType(typeName!, category, isValidType);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [allImages, setAllImages] = useState<Array<{ src: string; alt: string }>>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeSection, setActiveSection] = useState<string>('');
  const [cycleFilter, setCycleFilter] = useState<string>('All');
  const [sortMode, setSortMode] = useState<'default' | 'alphabetical'>('default');
  const { prefetchCollectiblesByType } = usePrefetch()
  const { isCompleted, toggle, completedIds } = useProgress()
  const resetActiveSection = () => setActiveSection('');

  const prevTypeName = useRef(typeName);
  if (typeName !== prevTypeName.current) {
    prevTypeName.current = typeName;
    setActiveSection('');
    setCycleFilter('All');
    setSortMode('default');
  }

  function slugifyTitle(title: string): string {
    return title.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9\u0370-\u03ff]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // Find current and next type - use the appropriate array based on category
  const typeArray = category === 'upgrades' ? upgradeTypes
    : category === 'materials' ? materialTypes
      : category === 'cosmetics' ? cosmeticTypes
        : collectibleTypes;

  const currentIndex = typeArray.findIndex(type => type === typeName);
  const nextType = currentIndex >= 0 && currentIndex < typeArray.length - 1
    ? typeArray[currentIndex + 1]
    : null;
  const previousType = currentIndex > 0 ? typeArray[currentIndex - 1] : null;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get unique cycles from the data
  const availableCycles = useMemo(() => {
    const cycleOrder = ['Base', 'NG+', 'NG++', 'DLC'];
    const cycles = new Set<string>();
    levelData.forEach(level =>
      level.locations.forEach(loc =>
        loc.collectibles.forEach(c => cycles.add(c.cycle))
      )
    );
    return cycleOrder.filter(c => cycles.has(c));
  }, [levelData]);

  const showCycleFilter = availableCycles.length > 1;

  // Filter data by cycle
  const filteredLevelData = useMemo(() => {
    if (cycleFilter === 'All') return levelData;

    return levelData
      .map(level => ({
        ...level,
        locations: level.locations
          .map(loc => ({
            ...loc,
            collectibles: loc.collectibles.filter(c => c.cycle === cycleFilter)
          }))
          .filter(loc => loc.collectibles.length > 0)
      }))
      .filter(level => level.locations.length > 0);
  }, [levelData, cycleFilter]);

  // Sort data alphabetically (wraps filtered data in a fake single-level structure)
  const sortedLevelData = useMemo(() => {
    // Generate unique slugs for ALL collectibles (both modes)
    const allCollectibles = filteredLevelData.flatMap(level =>
      level.locations.flatMap(loc => loc.collectibles)
    );

    const slugCounts: Record<string, number> = {};
    for (const c of allCollectibles) {
      const base = slugifyTitle(c.title);
      slugCounts[base] = (slugCounts[base] || 0) + 1;
    }

    const slugUsed: Record<string, number> = {};
    const slugMap = new Map<number, string>();
    for (const c of allCollectibles) {
      const base = slugifyTitle(c.title);
      if (slugCounts[base] > 1) {
        slugUsed[base] = (slugUsed[base] || 0) + 1;
        slugMap.set(c.id, `${base}-${slugUsed[base]}`);
      } else {
        slugMap.set(c.id, base);
      }
    }

    // Apply slugs to all collectibles
    const dataWithSlugs = filteredLevelData.map(level => ({
      ...level,
      locations: level.locations.map(loc => ({
        ...loc,
        collectibles: loc.collectibles.map(c => ({
          ...c,
          _slug: slugMap.get(c.id)!,
        }))
      }))
    }));

    if (sortMode !== 'alphabetical') return dataWithSlugs;

    const sorted = dataWithSlugs
      .flatMap(level =>
        level.locations.flatMap(loc =>
          loc.collectibles.map(c => ({
            ...c,
            _levelName: level.level_name,
            _locationName: loc.location_name,
          }))
        )
      )
      .sort((a, b) => a.title.localeCompare(b.title));

    if (sorted.length === 0) return [];

    return [{
      level_id: 0,
      level_name: 'All',
      level_order: 0,
      type_id: dataWithSlugs[0]?.type_id || 0,
      locations: [{
        location_id: 0,
        location_name: 'A\u2013Z',
        location_order: 0,
        collectibles: sorted
      }]
    }];
  }, [filteredLevelData, sortMode]);

  // Scroll to hash on load once data is ready
  useEffect(() => {
    if (levelData.length > 0 && window.location.hash) {
      const hash = decodeURIComponent(window.location.hash);
      requestAnimationFrame(() => {
        const el = document.getElementById(hash.substring(1));
        if (el) {
          const offset = 76;
          const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'instant' });
        }
      });
    }
  }, [levelData]);

  // Collect all images when data loads
  useEffect(() => {
    if (sortedLevelData.length > 0) {
      const images: Array<{ src: string; alt: string }> = [];
      sortedLevelData.forEach(level => {
        level.locations.forEach(location => {
          location.collectibles.forEach(collectible => {
            collectible.images?.forEach(img => {
              images.push({ src: img.url, alt: img.alt });
            });
          });
        });
      });
      setAllImages(images);
    }
  }, [sortedLevelData]);

  // Scroll spy effect
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -80% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    if (sortMode === 'alphabetical') {
      const articles = document.querySelectorAll('article[id]');
      articles.forEach((article) => observer.observe(article));
    }

    return () => observer.disconnect();
  }, [sortedLevelData, sortMode]);

  const handleImageClick = useCallback((imageUrl: string) => {
    const index = allImages.findIndex(img => img.src === imageUrl);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  }, [allImages]);

  // Format type name for display
  const displayTypeName = typeName
    ? typeName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  // Count totals (use full data for header, filtered for display)
  const totalCollectibles = levelData.reduce((sum, level) =>
    sum + level.locations.reduce((locSum, loc) =>
      locSum + loc.collectibles.reduce((s, c) => s + (c.quantity || 1), 0), 0), 0
  );
  const totalLevels = levelData.length;

  const filteredTotal = filteredLevelData.reduce((sum, level) =>
    sum + level.locations.reduce((locSum, loc) =>
      locSum + loc.collectibles.reduce((s, c) => s + (c.quantity || 1), 0), 0), 0
  );

  const structuredDataSchemas = useMemo(() => {
    if (levelData.length === 0) return undefined;

    let position = 0;

    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${displayTypeName} in Stellar Blade`,
      description: `All ${totalCollectibles} ${displayTypeName} across ${totalLevels} levels`,
      numberOfItems: totalCollectibles,
      category: displayTypeName,
      itemListElement: levelData.flatMap(level =>
        level.locations.flatMap(location =>
          location.collectibles.map(collectible => {
            position++;
            return {
              '@type': 'ListItem',
              position,
              name: collectible.title,
              description: collectible.description?.content || collectible.description?.items?.join(', '),
              ...(collectible.images?.[0] && {
                image: collectible.images[0].url
              })
            };
          })
        )
      )
    };

    return [itemListSchema];
  }, [levelData, displayTypeName, totalCollectibles, totalLevels]);

  // Generate table of contents links
  const activeLevelName = useMemo(() =>
    sortedLevelData.find(level =>
      level.locations.some(loc => {
        const sectionId = `${level.level_name}-${loc.location_name}`.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
        return sectionId === activeSection;
      })
    )?.level_name || sortedLevelData[0]?.level_name,
    [sortedLevelData, activeSection]
  );

  const tocLinks = useMemo(() => {
    if (sortMode === 'alphabetical') {
      const allCollectibles = sortedLevelData[0]?.locations[0]?.collectibles || [];
      return [{
        mainLink: '#all',
        title: `${allCollectibles.length} ${displayTypeName}`,
        subLinks: allCollectibles.map(c => ({
          href: `#${(c as any)._slug || slugifyTitle(c.title)}`,
          title: c.title
        }))
      }];
    }

    return sortedLevelData.map(level => {
      const levelId = level.level_name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

      return {
        mainLink: `#${levelId}`,
        title: level.level_name,
        subLinks: level.level_name === activeLevelName ? level.locations.map(loc => ({
          href: `#${level.level_name}-${loc.location_name}`.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, ''),
          title: loc.location_name
        })) : undefined
      };
    });
  }, [sortedLevelData, sortMode, activeLevelName, displayTypeName]);

  const categoryLabel = category === 'upgrades' ? 'All Upgrades'
    : category === 'materials' ? 'All Materials'
      : category === 'cosmetics' ? 'All Cosmetics'
        : 'All Collectibles'

  const handleTocNavigate = useCallback((href: string) => {
    const targetId = href.substring(1);

    if (sortMode === 'alphabetical') {
      setActiveSection(targetId);
      return;
    }

    // Check if this is a level link (e.g. #wasteland) vs a section link (e.g. #wasteland-scrap-yard)
    const matchedLevel = sortedLevelData.find(level => {
      const levelId = level.level_name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
      return levelId === targetId;
    });

    if (matchedLevel && matchedLevel.locations.length > 0) {
      // Clicked a level — set activeSection to its first location so sublinks open immediately
      const firstLoc = matchedLevel.locations[0];
      const sectionId = `${matchedLevel.level_name}-${firstLoc.location_name}`
        .toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
      setActiveSection(sectionId);
    } else {
      // Clicked a sublink — set directly
      setActiveSection(targetId);
    }
  }, [sortedLevelData, sortMode]);

  // Check for invalid type FIRST (before loading state)
  if (!isValidType) {
    return <ErrorPage code={404} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-main bg-primary">
        <div className="container mx-auto px-3 py-8">
          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <TableOfContentsSkeleton />
            </aside>

            <div className="flex-1 min-w-0">
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">{displayTypeName}</h1>
                    <div className="h-6 w-40 bg-gray-700/50 rounded animate-pulse" />
                  </div>

                  <div className="flex justify-end sm:justify-start order-3 sm:order-none">
                    <div className="px-3 py-1.5 text-sm rounded-lg border bg-gray-800/50 border-gray-700 text-gray-400">
                      A–Z
                    </div>
                  </div>

                  {TYPE_DESCRIPTIONS[typeName!] && (
                    <p className="text-gray-300 order-2 sm:order-none sm:basis-full">
                      {TYPE_DESCRIPTIONS[typeName!]}
                    </p>
                  )}
                </div>
              </div>

              <CollectibleSectionSkeleton id="skeleton-1" cardCount={3} hideTypeBadge />
              <CollectibleSectionSkeleton id="skeleton-2" cardCount={3} hideTypeBadge />
              <CollectibleSectionSkeleton id="skeleton-3" cardCount={3} hideTypeBadge />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error page with appropriate code
  if (isError) {
    const apiError = error as ApiError;
    return <ErrorPage code={apiError?.status || 500} />;
  }

  if (levelData.length === 0) {
    return <ErrorPage code={404} />;
  }

  return (
    <div className="min-h-dvh bg-primary">
      <SEO
        title={displayTypeName}
        description={
          showCycleFilter
            ? `All ${totalCollectibles} ${displayTypeName} in Stellar Blade — Base, NG+, NG++, and DLC. Filter by cycle, sort A–Z, with screenshots and location guides.`
            : `Complete guide to all ${totalCollectibles} ${displayTypeName} in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.`
        }
        canonical={`/${category}/${typeName}`}
      />
      <StructuredData
        type="CollectionPage"
        headline={`${displayTypeName} - Stellar Blade Guide`}
        description={`All ${totalCollectibles} ${displayTypeName} across ${totalLevels} levels in Stellar Blade.`}
        extraSchemas={structuredDataSchemas}
      />
      <div className="container mx-auto px-3 py-8">
        <div className="flex gap-8">
          {/* Sidebar with TOC */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4 pb-4">
              <TableOfContents
                links={tocLinks}
                currentLevel={typeName}
                activeSection={activeSection}
                onNavigate={handleTocNavigate}
              />
              <div className="mt-3">
                <BackToTop onScrollToTop={resetActiveSection} />
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* Page header + filters */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">{displayTypeName}</h1>
                  <p className="text-gray-300">
                    {cycleFilter !== 'All'
                      ? `${filteredTotal} of ${totalCollectibles} ${displayTypeName} (${cycleFilter})`
                      : `${totalCollectibles} ${displayTypeName}`
                    }
                    {completedIds.size > 0 && (() => {
                      const pageCollectibles = levelData.flatMap(l => l.locations.flatMap(loc => loc.collectibles));
                      const found = pageCollectibles
                        .filter(c => completedIds.has(c.id))
                        .reduce((sum, c) => sum + (c.quantity || 1), 0);
                      if (found === 0) return null;
                      return <span className="text-cyan-400 ml-2">· {found === totalCollectibles ? `all ${found}` : found} found</span>;
                    })()}
                  </p>
                </div>

                {/* Cycle filter */}
                {showCycleFilter && (
                  <div className="flex items-center justify-between w-full sm:w-auto sm:gap-2 order-3 sm:order-none">
                    <div className="flex flex-wrap items-center gap-2">
                      {['All', ...availableCycles].map(cycle => (
                        <button
                          key={cycle}
                          onClick={() => setCycleFilter(cycle)}
                          title={`Show ${cycle === 'All' ? 'all' : cycle} ${displayTypeName}`}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${cycleFilter === cycle
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                            }`}
                        >
                          {cycle}
                        </button>
                      ))}
                    </div>

                    <div className="w-px h-6 bg-gray-700 mx-2" />

                    <button
                      onClick={() => setSortMode(sortMode === 'alphabetical' ? 'default' : 'alphabetical')}
                      title="Sort alphabetically"
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${sortMode === 'alphabetical'
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                        }`}
                    >
                      A–Z
                    </button>
                  </div>
                )}

                {!showCycleFilter && (
                  <div className="flex justify-end sm:justify-start order-3 sm:order-none">
                    <button
                      onClick={() => setSortMode(sortMode === 'alphabetical' ? 'default' : 'alphabetical')}
                      title="Sort alphabetically"
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${sortMode === 'alphabetical'
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                        }`}
                    >
                      A–Z
                    </button>
                  </div>
                )}

                {TYPE_DESCRIPTIONS[typeName!] && (
                  <p className="text-gray-300 order-2 sm:order-none sm:basis-full">
                    {TYPE_DESCRIPTIONS[typeName!]}
                  </p>
                )}
              </div>
            </div>
            {/* Mobile TOC */}
            <FloatingTOC
              links={tocLinks}
              currentLevel={typeName}
              activeSection={activeSection}
              onNavigate={handleTocNavigate}
            />
            <MobileBackToTop onScrollToTop={resetActiveSection} />

            {/* Collectibles grouped by level (or flat A-Z) */}
            {sortedLevelData.map((level) => (
              <div key={level.level_id} id={level.level_name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')} className="space-y-8">
                {level.locations.map((location) => {
                  const sectionId = `${level.level_name}-${location.location_name}`.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

                  return (
                    <CollectibleSection
                      key={location.location_id}
                      id={sectionId}
                      title={sortMode === 'alphabetical' ? '' : location.location_name}
                      levelName={sortMode === 'alphabetical' ? '' : level.level_name}
                      collectibles={location.collectibles}
                      onImageClick={handleImageClick}
                      hideTypeBadge
                      itemLabel={displayTypeName}
                      isCompleted={isCompleted}
                      onToggleProgress={toggle}
                    />
                  );
                })}
              </div>
            ))}

            {/* Empty state when filter yields no results */}
            {sortedLevelData.length === 0 && cycleFilter !== 'All' && (
              <div className="bg-secondary rounded-lg p-8 border border-zinc-800 text-center">
                <p className="text-gray-400">No {cycleFilter} {displayTypeName} found.</p>
              </div>
            )}

            {/* Footer navigation */}
            <div className="mt-16 pt-8 border-t border-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3">
                {/* Next Type - first on mobile, right on desktop */}
                {nextType ? (
                  <Link
                    to={`/${category}/${nextType}`}
                    className="group w-full sm:w-auto order-1 sm:order-2"
                    onMouseEnter={() => prefetchCollectiblesByType(nextType, category)}
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 hover:from-cyan-600/30 hover:to-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-cyan-400 mb-0.5">Next</div>
                        <div className="text-sm font-medium text-white truncate">
                          {nextType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </div>
                      </div>
                      <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-cyan-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link
                    to={`/${category}`}
                    className="group w-full sm:w-auto order-1 sm:order-2"
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 hover:from-cyan-600/30 hover:to-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-cyan-400 mb-0.5">Finished</div>
                        <div className="text-sm font-medium text-white">
                          {categoryLabel}
                        </div>
                      </div>
                      <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-cyan-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                )}

                {/* Previous Type - second on mobile, left on desktop */}
                {previousType ? (
                  <Link
                    to={`/${category}/${previousType}`}
                    className="group w-full sm:w-auto order-2 sm:order-1"
                    onMouseEnter={() => prefetchCollectiblesByType(previousType, category)}
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition-all duration-200">
                      <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-gray-700 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 mb-0.5">Previous</div>
                        <div className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">
                          {previousType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="hidden sm:block order-2 sm:order-1"></div>
                )}
              </div>
            </div>
            <CommentSection contentType="collectible" contentId={levelData[0].type_id} />
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={allImages}
        index={lightboxIndex}
        plugins={[Zoom]}
        zoom={{ scrollToZoom: true }}
        controller={{ closeOnBackdropClick: true }}
        animation={{ fade: 200, swipe: 200 }}
        carousel={{ padding: isMobile ? "0%" : "4%" }}
        styles={{
          container: {
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(5px)"
          }
        }}
      />
    </div>
  );
}

export default CollectibleTypePage;