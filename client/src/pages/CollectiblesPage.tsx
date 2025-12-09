import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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
import { COLLECTIBLES } from '../constants/navigation'
import { Map, Package, ArrowLeft } from 'lucide-react'
import { usePrefetch } from '../hooks/usePrefetch'

function CollectibleTypePage() {
  const { typeName } = useParams<{ typeName: string }>();

  // Validate collectible type exists before showing loading state
  const collectibleTypes = COLLECTIBLES.map(c => c.slug);
  const isValidType = collectibleTypes.some(type =>
    type.toLowerCase().replace(/\s+/g, '-') === typeName
  );

  const { data: levelData = [], isLoading, isError, error } = useCollectiblesByType(typeName!);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [allImages, setAllImages] = useState<Array<{ src: string; alt: string }>>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeSection, setActiveSection] = useState<string>('');
  const { prefetchCollectiblesByType } = usePrefetch()

  useEffect(() => {
    setActiveSection('');
  }, [typeName]);

  // Find current and next type
  const currentIndex = collectibleTypes.findIndex(type => type === typeName);
  const nextType = currentIndex >= 0 && currentIndex < collectibleTypes.length - 1
    ? collectibleTypes[currentIndex + 1]
    : null;
  const previousType = currentIndex > 0 ? collectibleTypes[currentIndex - 1] : null;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Collect all images when data loads
  useEffect(() => {
    if (levelData.length > 0) {
      const images: Array<{ src: string; alt: string }> = [];
      levelData.forEach(level => {
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
  }, [levelData]);

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

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [levelData]);

  const handleImageClick = (imageUrl: string) => {
    const index = allImages.findIndex(img => img.src === imageUrl);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  // Format type name for display
  const displayTypeName = typeName
    ? typeName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  // Count totals
  const totalCollectibles = levelData.reduce((sum, level) =>
    sum + level.locations.reduce((locSum, loc) => locSum + loc.collectibles.length, 0), 0
  );
  const totalLevels = levelData.length;

  // Generate table of contents links - only show subLinks for the active level
  const activeLevelName = levelData.find(level =>
    level.locations.some(loc => {
      const sectionId = `${level.level_name}-${loc.location_name}`.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
      return sectionId === activeSection;
    })
  )?.level_name || levelData[0]?.level_name;

  const tocLinks = levelData.map(level => {
    const firstLocation = level.locations[0];
    const firstLocationId = firstLocation
      ? `#${level.level_name}-${firstLocation.location_name}`.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')
      : `#${level.level_name.toLowerCase().replace(/\s+/g, '-')}`;

    return {
      mainLink: firstLocationId,
      title: level.level_name,
      // Only include subLinks if this level contains the active section
      subLinks: level.level_name === activeLevelName ? level.locations.map(loc => ({
        href: `#${level.level_name}-${loc.location_name}`.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, ''),
        title: loc.location_name
      })) : undefined
    };
  });

  // Check for invalid type FIRST (before loading state)
  if (!isValidType) {
    return <ErrorPage code={404} />;
  }

  // Enhanced loading state with pixel-perfect skeletons
  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary">
        <div className="container mx-auto px-3 py-8">
          <div className="flex gap-8">
            {/* Skeleton sidebar - exact match */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <TableOfContentsSkeleton />
            </aside>

            {/* Skeleton main content */}
            <main className="flex-1 min-w-0">
              {/* Enhanced page header skeleton - matches actual header exactly */}
              <div className="mb-10">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <div className="h-10 md:h-14 w-80 bg-gray-700 rounded-lg animate-pulse mb-2"></div>
                  <span className="block text-2xl mt-2">
                    <div className="h-6 w-64 bg-gray-700 rounded-lg animate-pulse"></div>
                  </span>
                </h1>

                {/* Stats skeleton - matches actual badges */}
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="w-4 h-5 bg-blue-400/50 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-blue-300/30 rounded animate-pulse"></div>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="w-4 h-5 bg-purple-400/50 rounded animate-pulse"></div>
                    <div className="h-4 w-28 bg-purple-300/30 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Mobile TOC skeleton */}
              <div className="lg:hidden mb-8">
                <TableOfContentsSkeleton />
              </div>

              {/* Skeleton sections - matches CollectibleSection structure */}
              <CollectibleSectionSkeleton id="skeleton-1" cardCount={3} />
              <CollectibleSectionSkeleton id="skeleton-2" cardCount={3} />
              <CollectibleSectionSkeleton id="skeleton-3" cardCount={3} />
            </main>
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
    <div className="min-h-main bg-primary">
      <div className="container mx-auto px-3 py-8">
        <div className="flex gap-8">
          {/* Sidebar with TOC */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <TableOfContents
              links={tocLinks}
              currentLevel={typeName}
              activeSection={activeSection}
            />
          </aside>

          <main className="flex-1 min-w-0">
            {/* Enhanced page header */}
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  {displayTypeName}
                </span>
                <span className="block text-2xl text-gray-400 font-normal mt-2">All Locations</span>
              </h1>

              {/* Stats */}
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg">
                  <Map className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-300">
                    {totalLevels} {totalLevels === 1 ? 'Level' : 'Levels'}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/30 rounded-lg">
                  <Package className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">
                    {/* {totalCollectibles} {totalCollectibles === 1 ? 'Collectible' : 'Collectibles'} */}
                    {totalCollectibles} {displayTypeName}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile TOC */}
            <div className="lg:hidden mb-8">
              <TableOfContents links={tocLinks} currentLevel={typeName} activeSection={activeSection} />
            </div>

            {/* Collectibles grouped by level */}
            {levelData.map((level) => (
              <div key={level.level_id} className="space-y-8">
                {level.locations.map((location) => {
                  const sectionId = `${level.level_name}-${location.location_name}`.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

                  return (
                    <CollectibleSection
                      key={location.location_id}
                      id={sectionId}
                      title={location.location_name}
                      levelName={level.level_name}
                      collectibles={location.collectibles}
                      onImageClick={handleImageClick}
                      isInitialLoad={isLoading}
                    />
                  );
                })}
              </div>
            ))}

            {/* Footer navigation */}
            <div className="mt-16 pt-8 border-t border-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3">
                {/* Next Type - first on mobile, right on desktop */}
                {nextType ? (
                  <Link
                    to={`/collectibles/${nextType}`}
                    className="group w-full sm:w-auto order-1 sm:order-2"
                    onMouseEnter={() => prefetchCollectiblesByType(nextType)}
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gradient-to-r from-blue-600/20 to-blue-500/10 hover:from-blue-600/30 hover:to-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-blue-400 mb-0.5">Next</div>
                        <div className="text-sm font-medium text-white truncate">
                          {nextType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </div>
                      </div>
                      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-blue-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link
                    to="/collectibles"
                    className="group w-full sm:w-auto order-1 sm:order-2"
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gradient-to-r from-blue-600/20 to-blue-500/10 hover:from-blue-600/30 hover:to-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-blue-400 mb-0.5">Finished</div>
                        <div className="text-sm font-medium text-white">
                          All Collectibles
                        </div>
                      </div>
                      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-blue-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                )}

                {/* Previous Type - second on mobile, left on desktop */}
                {previousType ? (
                  <Link
                    to={`/collectibles/${previousType}`}
                    className="group w-full sm:w-auto order-2 sm:order-1"
                    onMouseEnter={() => prefetchCollectiblesByType(previousType)}
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition-all duration-200">
                      <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-gray-700 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5">Previous</div>
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
          </main>
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