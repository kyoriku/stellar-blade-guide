
import { useEffect, useState } from 'react'
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
import { ArrowLeft, MapPin, Package } from 'lucide-react'

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

  // const tocLinks = allLevels.map(level => ({
  //   mainLink: `/levels/${level.toLowerCase().replace(/\s+/g, '-')}`,
  //   title: level,
  //   subLinks: level === displayLevelName
  //     ? locationData.map(loc => ({
  //       href: `#${loc.location_name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`,
  //       title: loc.location_name
  //     }))
  //     : undefined
  // }));
  const tocLinks = [{
  mainLink: '#', // or `#${levelName}`
  title: displayLevelName,
  subLinks: locationData.map(loc => ({
    href: `#${loc.location_name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`,
    title: loc.location_name
  }))
}];

  // Count total collectibles
  const totalCollectibles = locationData.reduce((sum, loc) => sum + loc.collectibles.length, 0);

  // Check for invalid level FIRST (before loading state)
  if (!isValidLevel) {
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

  if (locationData.length === 0) {
    return <ErrorPage code={404} />;
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto px-3 py-8">
        <div className="flex gap-8">
          {/* Enhanced sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <TableOfContents links={tocLinks} currentLevel={levelName} activeSection={activeSection} />
          </aside>

          <main className="flex-1 min-w-0">
            {/* Enhanced page header */}
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  {displayLevelName}
                </span>
                <span className="block text-2xl text-gray-400 font-normal mt-2">Collectibles Guide</span>
              </h1>

              {/* Stats */}
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-300">
                    {locationData.length} {locationData.length === 1 ? 'Location' : 'Locations'}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/30 rounded-lg">
                  <Package className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">
                    {totalCollectibles} {totalCollectibles === 1 ? 'Collectible' : 'Collectibles'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile TOC */}
            <div className="lg:hidden mb-8">
              <TableOfContents links={tocLinks} currentLevel={levelName} activeSection={activeSection} />
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
                  isInitialLoad={isLoading}
                />
              );
            })}

            {/* Footer navigation */}
            <div className="mt-16 pt-8 border-t border-gray-800">
              <div className="flex justify-between items-center">
                <div className="text-gray-400 text-sm">
                  Completed viewing {displayLevelName}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-2">Continue to next guide</p>
                  {nextLevel ? (
                    <Link
                      to={`/levels/${nextLevel.toLowerCase().replace(/\s+/g, '-')}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                    >
                      Next Level
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </Link>
                  ) : (
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                    >
                      Back to Home
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Enhanced Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={allImages}
        index={lightboxIndex}
        plugins={[Zoom]}
        zoom={{ scrollToZoom: true }}
        controller={{ closeOnBackdropClick: true }}
        animation={{ fade: 250, swipe: 250 }}
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