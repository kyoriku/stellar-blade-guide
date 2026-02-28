import { useEffect, useState, useMemo } from 'react'
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
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import CommentSection from '../components/comments/CommentSection'

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

  // function stringToId(str: string): number {
  //   let hash = 0
  //   for (let i = 0; i < str.length; i++) {
  //     hash = (hash << 5) - hash + str.charCodeAt(i)
  //     hash |= 0
  //   }
  //   return Math.abs(hash)
  // }

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
  const { data: levelData = [] as LevelData, isLoading, isError, error } = useCollectiblesByType(typeName!, category);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [allImages, setAllImages] = useState<Array<{ src: string; alt: string }>>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeSection, setActiveSection] = useState<string>('');
  const { prefetchCollectiblesByType } = usePrefetch()

  useEffect(() => {
    setActiveSection('');
  }, [typeName]);

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
              <div className="md:mb-8 mb-9">
                <div className="h-9 md:h-10 w-64 bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-5 w-40 bg-gray-700/50 rounded mt-2 animate-pulse" />
              </div>

              <div className="lg:hidden mb-8">
                <TableOfContentsSkeleton collapsible />
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
    const apiError = error as ApiError;
    return <ErrorPage code={apiError?.status || 500} />;
  }

  if (levelData.length === 0) {
    return <ErrorPage code={404} />;
  }

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title={displayTypeName}
        description={`Find all ${totalCollectibles} ${displayTypeName} locations in Stellar Blade with screenshots and detailed guides across ${totalLevels} levels.`}
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
            <TableOfContents
              links={tocLinks}
              currentLevel={typeName}
              activeSection={activeSection}
            />
          </aside>

          <div className="flex-1 min-w-0">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{displayTypeName}</h1>
              <p className="text-gray-400">{totalCollectibles} {displayTypeName} across {totalLevels} {totalLevels === 1 ? 'level' : 'levels'}</p>
            </div>

            {/* Mobile TOC */}
            <div className="lg:hidden mb-8">
              <TableOfContents links={tocLinks} currentLevel={typeName} activeSection={activeSection} collapsible />
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
                          All Collectibles
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