import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLevelCollectibles } from '../hooks/useCollectibles'
import { ApiError } from '../services/api'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import TableOfContents from '../components/TableOfContents'
import CollectibleSection from '../components/CollectibleSection'
import ErrorPage from './ErrorPage'
import TableOfContentsSkeleton from '../components/TableOfContentsSkeleton'
import CollectibleSectionSkeleton from '../components/CollectibleSectionSkeleton'
import { LEVELS } from '../constants/navigation'
import { ArrowLeft } from 'lucide-react'
import { usePrefetch } from '../hooks/usePrefetch'
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';

function LevelPage() {
  const { levelName } = useParams<{ levelName: string }>();

  // Validate level exists before showing loading state
  const allLevels = LEVELS.map(level => level.name);
  const isValidLevel = allLevels.some(level =>
    level.toLowerCase().replace(/\s+/g, '-') === levelName
  );

  const { data: locationData = [], isLoading, isError, error } = useLevelCollectibles(levelName!);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [allImages, setAllImages] = useState<Array<{ src: string; alt: string }>>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeSection, setActiveSection] = useState<string>('');
  const { prefetchLevel } = usePrefetch()

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
  }, [locationData]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (locationData.length > 0) {
      const images: Array<{ src: string; alt: string }> = [];
      locationData.forEach(location => {
        location.collectibles.forEach(collectible => {
          collectible.images?.forEach(img => {
            images.push({ src: img.url, alt: img.alt });
          });
        });
      });
      setAllImages(images);
    }
  }, [locationData]);

  const handleImageClick = (imageUrl: string) => {
    const index = allImages.findIndex(img => img.src === imageUrl);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  const displayLevelName = levelName?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';

  // Find current and next level
  const currentIndex = allLevels.findIndex(level =>
    level.toLowerCase().replace(/\s+/g, '-') === levelName
  );
  const nextLevel = currentIndex >= 0 && currentIndex < allLevels.length - 1
    ? allLevels[currentIndex + 1]
    : null;
  const previousLevel = currentIndex > 0 ? allLevels[currentIndex - 1] : null;

  const tocLinks = [{
    mainLink: '#',
    title: displayLevelName,
    subLinks: locationData.map(loc => ({
      href: `#${loc.location_name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`,
      title: loc.location_name
    }))
  }];

  // Count total collectibles
  const totalCollectibles = locationData.reduce((sum, loc) => sum + loc.collectibles.length, 0);

  const structuredDataSchemas = useMemo(() => {
    if (locationData.length === 0) return undefined;

    let position = 0;

    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${displayLevelName} Collectibles`,
      description: `All ${totalCollectibles} collectibles in ${displayLevelName}`,
      numberOfItems: totalCollectibles,
      itemListElement: locationData.flatMap(location =>
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
    };

    return [itemListSchema];
  }, [locationData, displayLevelName, totalCollectibles]);

  // Check for invalid level FIRST (before loading state)
  if (!isValidLevel) {
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

            <main className="flex-1 min-w-0">
              <div className="md:mb-8 mb-9">
                <div className="h-9 md:h-10 w-64 bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-5 w-48 bg-gray-700/50 rounded mt-2 animate-pulse mb-3" />
              </div>

              <div className="lg:hidden mb-8">
                <TableOfContentsSkeleton collapsible />
              </div>

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

  if (locationData.length === 0) {
    return <ErrorPage code={404} />;
  }

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title={displayLevelName}
        description={`Find all ${totalCollectibles} collectibles across ${locationData.length} locations in ${displayLevelName}. Complete guide with screenshots and locations.`}
        canonical={`/levels/${levelName}`}
      />
      <StructuredData
        type="CollectionPage"
        headline={`${displayLevelName} Collectibles Guide`}
        description={`Find all ${totalCollectibles} collectibles across ${locationData.length} locations in ${displayLevelName}.`}
        extraSchemas={structuredDataSchemas}
      />

      <div className="container mx-auto px-3 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <TableOfContents links={tocLinks} currentLevel={levelName} activeSection={activeSection} />
          </aside>

          <main className="flex-1 min-w-0">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{displayLevelName}</h1>
              <p className="text-gray-400">{totalCollectibles} collectibles across {locationData.length} {locationData.length === 1 ? 'location' : 'locations'}</p>
            </div>

            {/* Mobile TOC */}
            <div className="lg:hidden mb-8">
              <TableOfContents links={tocLinks} currentLevel={levelName} activeSection={activeSection} collapsible/>
            </div>

            {/* Collectible sections */}
            {locationData.map((location) => {
              const sectionId = location.location_name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

              return (
                <CollectibleSection
                  key={location.location_id}
                  id={sectionId}
                  title={location.location_name}
                  levelName={displayLevelName}
                  collectibles={location.collectibles}
                  onImageClick={handleImageClick}
                />
              );
            })}

            {/* Footer navigation */}
            <div className="mt-16 pt-8 border-t border-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3">
                {/* Next Level - first on mobile, right on desktop */}
                {nextLevel ? (
                  <Link
                    to={`/levels/${nextLevel.toLowerCase().replace(/\s+/g, '-')}`}
                    className="group w-full sm:w-auto order-1 sm:order-2"
                    onMouseEnter={() => prefetchLevel(nextLevel.toLowerCase().replace(/\s+/g, '-'))}
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gradient-to-r from-blue-600/20 to-blue-500/10 hover:from-blue-600/30 hover:to-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-blue-400 mb-0.5">Next</div>
                        <div className="text-sm font-medium text-white truncate">
                          {nextLevel}
                        </div>
                      </div>
                      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-blue-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link
                    to="/levels"
                    className="group w-full sm:w-auto order-1 sm:order-2"
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gradient-to-r from-blue-600/20 to-blue-500/10 hover:from-blue-600/30 hover:to-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-blue-400 mb-0.5">Finished</div>
                        <div className="text-sm font-medium text-white">
                          All Levels
                        </div>
                      </div>
                      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-blue-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                )}

                {/* Previous Level - second on mobile, left on desktop */}
                {previousLevel ? (
                  <Link
                    to={`/levels/${previousLevel.toLowerCase().replace(/\s+/g, '-')}`}
                    className="group w-full sm:w-auto order-2 sm:order-1"
                    onMouseEnter={() => prefetchLevel(previousLevel.toLowerCase().replace(/\s+/g, '-'))}
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

export default LevelPage;