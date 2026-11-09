import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, Link, NavigationType, useLocation, useNavigationType } from 'react-router-dom'
import { useLevelCollectibles } from '../hooks/useCollectibles'
import QueryError from '../components/QueryError'
import PageLightbox from '../components/PageLightbox'
import TableOfContents from '../components/TableOfContents'
import CollectibleSection from '../components/CollectibleSection'
import ErrorPage from './ErrorPage'
import TableOfContentsSkeleton from '../components/TableOfContentsSkeleton'
import CollectibleSectionSkeleton from '../components/CollectibleSectionSkeleton'
import { LEVELS } from '../constants/navigation'
import { LEVEL_IMAGES } from '../constants/categoryImages'
import { LEVEL_SEO, isLevelSlug } from '../constants/levelSeo'
import { ArrowLeft } from 'lucide-react'
import { usePrefetch } from '../hooks/usePrefetch'
import { useProgress } from '../hooks/useProgress'
import { useHandClearTip } from '../hooks/useHandClearTip'
import { useActiveSection } from '../hooks/useActiveSection'
import { useHashJump } from '../hooks/useHashJump'
import { usePageLightbox, levelPageGalleries } from '../hooks/usePageLightbox'
import { ogImageUrl } from '../utils/image'
import { scrollToCard } from '../utils/scrollToElement'
import { slugifyPlace } from '../utils/slugify'
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import { SECTION_LABELS } from '../constants/sections'
import CommentSection from '../components/comments/CommentSection'
import FloatingTOC from '../components/FloatingTOC'
import BackToTop from '../components/BackToTop'
import MobileBackToTop from '../components/MobileBackToTop'
import { descriptionPlainText } from '../utils/descriptionText'
import { cycleLabel } from '../constants/cycleLabels'
import { DEFAULT_FILTERS, offeredFilters, readFilters, rememberFilters } from '../utils/entryFilters'

// A selected pill or an on toggle. Forced colours replace its tint, so there it gets a
// 2px Highlight border, with a pixel less padding so its size doesn't change (the
// Progress page's cycle pills do the same).
const PILL_SELECTED = 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 forced-colors:border-2 forced-colors:border-[Highlight] forced-colors:px-2.75 forced-colors:py-1.25'

function LevelDetailPage() {
  const { levelName } = useParams<{ levelName: string }>();
  const location = useLocation();
  const navigationType = useNavigationType();

  const allLevels = LEVELS.map(level => level.name);

  const { data: locationData = [], isLoading, isError, error, refetch } = useLevelCollectibles(levelName!, !!levelName && isLevelSlug(levelName));

  // A reload, or Back or Forward from another page, opens on the filter this entry showed.
  const [cycleFilter, setCycleFilter] = useState(() => readFilters(location.state, location.pathname).cycle);
  const { prefetchLevel } = usePrefetch()
  const { isCompleted, isToggling, toggle, completedIds } = useProgress()
  // Manage progress names a level by its exact name, which only the nav holds.
  const tipLevel = LEVELS.find(level => level.slug === levelName)
  const noteToggle = useHandClearTip(tipLevel ? `level:${tipLevel.name}` : null, tipLevel?.name ?? '')
  // Stable like toggle itself, so memo(CollectibleSection) still bails out.
  const toggleProgress = useCallback((id: number) => {
    const found = toggle(id)
    if (found !== undefined) noteToggle(id, found)
  }, [toggle, noteToggle])

  // Once per navigation, when the cards are on screen.
  useHashJump(locationData.length > 0 && !isError, scrollToCard);

  const displayLevelName = levelName?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';

  // Find current and next level
  const currentIndex = allLevels.findIndex(level =>
    level.toLowerCase().replace(/\s+/g, '-') === levelName
  );
  const nextLevel = currentIndex >= 0 && currentIndex < allLevels.length - 1
    ? allLevels[currentIndex + 1]
    : null;
  const previousLevel = currentIndex > 0 ? allLevels[currentIndex - 1] : null;

  // Count total collectibles. Quantity-weighted (a ×2 card counts 2) — the
  // site-wide unit, matching the progress page and stats endpoint; entries
  // remain the tracking granularity (one checkbox per card).
  const totalCollectibles = locationData.reduce((sum, loc) =>
    sum + loc.collectibles.reduce((s, c) => s + (c.quantity || 1), 0), 0);

  const availableCycles = useMemo(() => {
    const cycleOrder = ['Base', 'NG+', 'NG++', 'DLC'];
    const cycles = new Set<string>();
    locationData.forEach(loc => loc.collectibles.forEach(c => cycles.add(c.cycle)));
    return cycleOrder.filter(c => cycles.has(c));
  }, [locationData]);

  const showCycleFilter = availableCycles.length > 1;

  const filteredLocationData = useMemo(() => {
    if (cycleFilter === 'All') return locationData;
    return locationData
      .map(loc => ({
        ...loc,
        collectibles: loc.collectibles.filter(c => c.cycle === cycleFilter)
      }))
      .filter(loc => loc.collectibles.length > 0);
  }, [locationData, cycleFilter]);

  // The filtered list: the sections a cycle filter brings back are new elements to observe.
  const [activeSection, setActiveSection] = useActiveSection('section[id]', [filteredLocationData]);
  const resetActiveSection = () => setActiveSection('');

  // Once per navigation, in render so its own commit (the jump included) shows the right list,
  // and in state, not refs: React may set a render aside. A new level, Back or Forward takes
  // the entry's filter. Chained, so each pass sees what the last one set.
  const [navFor, setNavFor] = useState(location);
  const [filtersFor, setFiltersFor] = useState(levelName);
  if (location !== navFor) {
    setNavFor(location);
    if (levelName !== filtersFor) {
      setFiltersFor(levelName);
      setActiveSection('');
    }
    if (levelName !== filtersFor || navigationType === NavigationType.Pop) {
      const { cycle } = readFilters(location.state, location.pathname);
      if (cycle !== cycleFilter) setCycleFilter(cycle);
    }
  } else if (locationData.length > 0) {
    // A cycle the loaded level doesn't offer goes back to All: one kept from before a
    // content change.
    const { cycle } = offeredFilters({ ...DEFAULT_FILTERS, cycle: cycleFilter }, showCycleFilter ? availableCycles : [], null);
    if (cycle !== cycleFilter) setCycleFilter(cycle);
  }

  // The entry keeps what it shows, for Back, Forward and a reload. The router's copy of the
  // entry's state goes stale here: never pass location.state on.
  useEffect(() => {
    rememberFilters(window.history, location, window.location.pathname, { ...DEFAULT_FILTERS, cycle: cycleFilter });
  }, [location, cycleFilter]);

  // The lightbox holds the cards this page shows (after its cycle filter), in page order.
  const { onImageClick, lightbox } = usePageLightbox(filteredLocationData, levelPageGalleries);

  // The first gallery on the page is above the fold, so it loads eagerly. Keyed
  // by id rather than index because the list is two levels deep and each
  // section only sees its own slice. An imageless first card is skipped —
  // ImageGallery renders nothing for one — and an all-imageless page yields
  // undefined, which matches no collectible.
  const priorityId = useMemo(
    () => filteredLocationData
      .flatMap(loc => loc.collectibles)
      .find(c => c.images?.length > 0)?.id,
    [filteredLocationData]
  );

  const filteredTotal = useMemo(() =>
    filteredLocationData.reduce((sum, loc) =>
      sum + loc.collectibles.reduce((s, c) => s + (c.quantity || 1), 0), 0),
    [filteredLocationData]);

  const firstSectionId = filteredLocationData.length > 0
    ? `#${slugifyPlace(filteredLocationData[0].location_name)}`
    : '#';

  const tocLinks = [{
    mainLink: firstSectionId,
    title: displayLevelName,
    subLinks: filteredLocationData.map(loc => ({
      href: `#${slugifyPlace(loc.location_name)}`,
      title: loc.location_name
    }))
  }];

  const structuredDataSchemas = useMemo(() => {
    if (locationData.length === 0) return undefined;

    let position = 0;

    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${displayLevelName} Collectibles`,
      description: `All ${totalCollectibles} collectibles in ${displayLevelName}`,
      numberOfItems: totalCollectibles,
      category: [...new Set(locationData.flatMap(loc =>
        loc.collectibles.flatMap(c => c.types)
      ))].join(', '),
      itemListElement: locationData.flatMap(location =>
        location.collectibles.map(collectible => {
          position++;
          return {
            '@type': 'ListItem',
            position,
            name: collectible.title,
            description: descriptionPlainText(collectible.description),
            ...(collectible.images?.[0] && {
              image: collectible.images[0].url
            })
          };
        })
      )
    };

    return [itemListSchema];
  }, [locationData, displayLevelName, totalCollectibles]);

  // Check for invalid level FIRST (before loading state)
  if (!levelName || !isLevelSlug(levelName)) {
    return <ErrorPage code={404} />;
  }

  const { title: seoTitle, description: seoDescription } = LEVEL_SEO[levelName];
  const levelOgImage = LEVEL_IMAGES[levelName]
    ? ogImageUrl(LEVEL_IMAGES[levelName])
    : undefined;
  // Title and description are static per level, so every render state (loading
  // included) carries the same head tags.
  const seo = (
    <SEO
      title={seoTitle}
      description={seoDescription}
      canonical={`/levels/${levelName}`}
      ogImage={levelOgImage}
    />
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 bg-primary">
        {seo}
        <div className="container mx-auto px-3 py-8">
          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <TableOfContentsSkeleton />
            </aside>

            <div className="flex-1 min-w-0">
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">{displayLevelName}</h1>
                    <div className="h-6 w-48 bg-gray-700/50 rounded animate-pulse" />
                  </div>

                  {/* Reserves the cycle-filter row so sections don't shift when
                      the filter mounts; styled as the real "All" button will be (on,
                      unless the entry kept another cycle) so it reads unchanged
                      once the real row replaces it. Altess
                      Levoire and Nest hold Base-cycle items only — no filter
                      appears on load, so reserving the row there would shift
                      content the other way. */}
                  {levelName !== 'altess-levoire' && levelName !== 'nest' && (
                    <div className="flex flex-wrap items-center gap-2 order-3 sm:order-none">
                      <div className={`px-3 py-1.5 text-sm rounded-lg border ${cycleFilter === 'All' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-gray-800/50 border-gray-700 text-gray-400'}`}>
                        All
                      </div>
                    </div>
                  )}

                  <p className="text-gray-300 order-2 sm:order-none sm:basis-full">
                    {seoDescription}
                  </p>
                </div>
              </div>

              <CollectibleSectionSkeleton id="skeleton-1" cardCount={3} />
              <CollectibleSectionSkeleton id="skeleton-2" cardCount={3} />
              <CollectibleSectionSkeleton id="skeleton-3" cardCount={3} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error page with appropriate code
  if (isError) {
    return <QueryError error={error} onRetry={() => void refetch()} />;
  }

  if (locationData.length === 0) {
    return <ErrorPage code={404} />;
  }

  return (
    <div className="flex-1 bg-primary">
      {seo}
      <StructuredData
        type="CollectionPage"
        headline={`${displayLevelName} Collectibles Guide`}
        description={`Find all ${totalCollectibles} collectibles across ${locationData.length} locations in ${displayLevelName}.`}
        extraSchemas={structuredDataSchemas}
        breadcrumbs={[
          { name: SECTION_LABELS.levels, path: '/levels' },
          { name: displayLevelName, path: `/levels/${levelName}` },
        ]}
      />

      <div className="container mx-auto px-3 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            {/* Clears the fixed navbar. At top-4 the panel's first 49px sat
                behind the bar, clipping its corner and half the heading — the
                nav is z-50 and this wrapper is z-auto, so the bar wins on paint.
                The bar genuinely occupies that space (the logo spans the same
                x-range as this panel), so raising z-index would just obscure the
                logo instead.
                2rem, not 1rem, because it matches the container's own py-8: the
                flex row already starts at nav + 32px, so pinning there means the
                panel NEVER moves — no travel between its flow position and the
                pin. Measured 0px at every scroll offset. Derived from
                --nav-height so it cannot drift, and so print (where that
                variable is 0) keeps the original 32px.
                TableOfContents' two max-h budgets give back the same 81px this
                gains, or the panel runs off the bottom. */}
            <div className="sticky top-[calc(var(--nav-height)+2rem)] pb-4">
              <TableOfContents
                links={tocLinks}
                currentLevel={levelName}
                activeSection={activeSection}
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
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">{displayLevelName}</h1>
                  <p className="text-gray-300">
                    {cycleFilter !== 'All'
                      ? `${filteredTotal} of ${totalCollectibles} collectibles (${cycleLabel(cycleFilter)})`
                      : `${totalCollectibles} collectibles`
                    }
                    {completedIds.size > 0 && (() => {
                      // Over the entries the count line counts, so the cycle filter narrows both.
                      const found = filteredLocationData
                        .flatMap(loc => loc.collectibles)
                        .filter(c => completedIds.has(c.id))
                        .reduce((sum, c) => sum + (c.quantity || 1), 0);
                      if (found === 0) return null;
                      return <span className="text-cyan-400 ml-2">· {found === filteredTotal ? `all ${found}` : found} found</span>;
                    })()}
                  </p>
                </div>

                {showCycleFilter && (
                  <div className="flex flex-wrap items-center gap-2 order-3 sm:order-none">
                    {['All', ...availableCycles].map(cycle => (
                      <button
                        key={cycle}
                        onClick={() => setCycleFilter(cycle)}
                        // Says which pill is selected, which the tint alone can't.
                        aria-pressed={cycleFilter === cycle}
                        title={`Show ${cycle === 'All' ? 'all' : cycleLabel(cycle)} collectibles`}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${cycleFilter === cycle
                          ? PILL_SELECTED
                          : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                          }`}
                      >
                        {cycleLabel(cycle)}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-gray-300 order-2 sm:order-none sm:basis-full">
                  {seoDescription}
                </p>
              </div>
            </div>

            {/* Mobile TOC */}
            <div className="lg:hidden mb-8">
              <FloatingTOC 
                links={tocLinks} 
                currentLevel={levelName} 
                activeSection={activeSection} 
              />
              <MobileBackToTop onScrollToTop={resetActiveSection} />
            </div>

            {/* Collectible sections, in the order usePageLightbox walks them (levelPageGalleries) */}
            {filteredLocationData.map((location) => {
              const sectionId = slugifyPlace(location.location_name);

              return (
                <CollectibleSection
                  key={location.location_id}
                  id={sectionId}
                  title={location.location_name}
                  levelName={displayLevelName}
                  collectibles={location.collectibles}
                  onImageClick={onImageClick}
                  priorityId={priorityId}
                  isCompleted={isCompleted}
                  isToggling={isToggling}
                  onToggleProgress={toggleProgress}
                />
              );
            })}

            {filteredLocationData.length === 0 && cycleFilter !== 'All' && (
              <div className="bg-secondary rounded-lg p-8 border border-zinc-800 text-center">
                <p className="text-gray-400">No {cycleLabel(cycleFilter)} collectibles found.</p>
              </div>
            )}

            {/* Footer navigation */}
            <div className="mt-8 pt-8 border-t border-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3">
                {/* Next Level - first on mobile, right on desktop */}
                {nextLevel ? (
                  <Link
                    to={`/levels/${nextLevel.toLowerCase().replace(/\s+/g, '-')}`}
                    className="group w-full sm:w-auto order-1 sm:order-2"
                    onMouseEnter={() => void prefetchLevel(nextLevel.toLowerCase().replace(/\s+/g, '-'))}
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 hover:from-cyan-600/30 hover:to-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-cyan-400 mb-0.5">Next</div>
                        <div className="text-sm font-medium text-white truncate">
                          {nextLevel}
                        </div>
                      </div>
                      <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-cyan-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link
                    to="/levels"
                    className="group w-full sm:w-auto order-1 sm:order-2"
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 hover:from-cyan-600/30 hover:to-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-cyan-400 mb-0.5">Finished</div>
                        <div className="text-sm font-medium text-white">
                          All Levels
                        </div>
                      </div>
                      <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-cyan-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                )}

                {/* Previous Level - second on mobile, left on desktop */}
                {previousLevel ? (
                  <Link
                    to={`/levels/${previousLevel.toLowerCase().replace(/\s+/g, '-')}`}
                    className="group w-full sm:w-auto order-2 sm:order-1"
                    onMouseEnter={() => void prefetchLevel(previousLevel.toLowerCase().replace(/\s+/g, '-'))}
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition-all duration-200">
                      <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-gray-700 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5">Previous</div>
                        <div className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">
                          {previousLevel}
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="hidden sm:block order-2 sm:order-1"></div>
                )}
              </div>
            </div>
            <CommentSection contentType="level" contentId={locationData[0].level_id} />
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <PageLightbox {...lightbox} />
    </div>
  );
}

export default LevelDetailPage;