import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWalkthrough, useWalkthroughsByType } from '../hooks/useWalkthroughs'
import { ApiError } from '../services/api'
import { List, ArrowLeft } from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import WalkthroughContent from '../components/WalkthroughContent'
import WalkthroughContentSkeleton from '../components/WalkthroughContentSkeleton'
import ErrorPage from './ErrorPage'
import TableOfContents from '../components/TableOfContents'
import TableOfContentsSkeleton from '../components/TableOfContentsSkeleton'
import { usePrefetch } from '../hooks/usePrefetch'
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';

function WalkthroughPage() {
  const { type, slug } = useParams<{ type: string; slug: string }>();

  const { data: walkthrough, isLoading, isError, error } = useWalkthrough(type!, slug!);
  const { data: allWalkthroughs = [] } = useWalkthroughsByType(type!);
  const { prefetchWalkthroughBySlug } = usePrefetch();
  const [activeSection, setActiveSection] = useState<string>('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [allImages, setAllImages] = useState<Array<{ src: string; alt: string }>>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Collect all images when walkthrough loads
  useEffect(() => {
    if (walkthrough) {
      const images: Array<{ src: string; alt: string }> = [];
      walkthrough.content.forEach(content => {
        content.images?.forEach(img => {
          images.push({ src: img.url, alt: img.alt });
        });
      });
      setAllImages(images);
    }
  }, [walkthrough]);

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
    const sections = document.querySelectorAll('.walkthrough-content');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [walkthrough]);

  const handleImageClick = (imageUrl: string) => {
    const index = allImages.findIndex(img => img.src === imageUrl);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  // Find current, previous, and next walkthroughs
  const currentIndex = allWalkthroughs.findIndex(w => w.slug === slug);
  const previousWalkthrough = currentIndex > 0 ? allWalkthroughs[currentIndex - 1] : null;
  const nextWalkthrough = currentIndex >= 0 && currentIndex < allWalkthroughs.length - 1
    ? allWalkthroughs[currentIndex + 1]
    : null;

  if (isLoading) {
    return (
      <div className="min-h-main bg-primary">
        <div className="container mx-auto px-3 py-8">
          <div className="flex gap-8">
            {/* Skeleton sidebar - exact match */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <TableOfContentsSkeleton />
            </aside>

            {/* Skeleton main content */}
            <main className="flex-1 min-w-0">
              {/* Page header skeleton */}
              <div className="md:mb-8 mb-9">
                <div className="h-9 md:h-10 w-80 bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-5 w-64 bg-gray-700/50 rounded mt-2 animate-pulse" />
              </div>

              {/* Meta badge skeleton */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="w-4 h-4 bg-blue-400/50 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-blue-300/30 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Objectives skeleton */}
              <div className="mb-6 p-4 bg-secondary rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-purple-400/50 rounded animate-pulse"></div>
                  <div className="h-6 w-24 bg-gray-700 rounded animate-pulse"></div>
                </div>
                <ul className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <div className="h-6 bg-gray-700 rounded animate-pulse flex-1"></div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mobile TOC skeleton */}
              <div className="lg:hidden mb-8">
                <TableOfContentsSkeleton collapsible />
              </div>

              {/* Walkthrough content skeletons */}
              <section className="mb-16 space-y-4">
                <WalkthroughContentSkeleton />
                <WalkthroughContentSkeleton />
                <WalkthroughContentSkeleton />
              </section>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const apiError = error as ApiError;
    return <ErrorPage code={apiError?.status || 500} />;
  }

  if (!walkthrough) {
    return <ErrorPage code={404} />;
  }

  // Generate TOC from content sections
  const tocLinks = walkthrough.objectives && walkthrough.objectives.length > 0
    ? [{
      mainLink: '#objectives',
      title: 'Objectives',
      subLinks: walkthrough.objectives.map((objective, idx) => ({
        href: `#objective-${idx}`,
        title: objective
      }))
    }]
    : [];

  // Add content sections to TOC
  walkthrough.content.forEach((content) => {
    if (content.section_title) {
      tocLinks.push({
        mainLink: `#section-${content.order}`,
        title: content.section_title,
        subLinks: []
      });
    }
  });

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title={walkthrough.title}
        description={walkthrough.subtitle || `Complete walkthrough for ${walkthrough.title} in Stellar Blade. Step-by-step guide with screenshots and tips.`}
        canonical={`/walkthroughs/${type}/${slug}`}
      />
      <StructuredData
        type="WebPage"
        headline={walkthrough.title}
        description={walkthrough.subtitle || `Complete walkthrough for ${walkthrough.title} in Stellar Blade.`}
        extraSchemas={[{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: walkthrough.title,
          ...(walkthrough.subtitle && { alternativeHeadline: walkthrough.subtitle }),
          description: walkthrough.subtitle || `Complete walkthrough for ${walkthrough.title} in Stellar Blade.`,
          articleSection: walkthrough.mission_type,
          ...(walkthrough.content.find(c => c.images?.length > 0)?.images[0] && {
            image: walkthrough.content.find(c => c.images?.length > 0)!.images[0].url
          }),
          wordCount: walkthrough.content.reduce((sum, c) => sum + c.text.split(/\s+/).length, 0),
          isPartOf: {
            '@type': 'WebSite',
            name: 'Stellar Blade Guide',
            url: 'https://stellarbladeguide.com'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Stellar Blade Guide'
          }
        }]}
      />

      <div className="container mx-auto px-3 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <TableOfContents links={tocLinks} activeSection={activeSection} />
          </aside>

          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {walkthrough.title}
              </h1>
              {walkthrough.subtitle && (
                <p className="text-gray-400">{walkthrough.subtitle}</p>
              )}
            </div>

            {/* Objectives */}
            {walkthrough.objectives && walkthrough.objectives.length > 0 && (
              <div id="objectives" className="mb-6 p-4 bg-secondary rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <List className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Objectives</h2>
                </div>
                <ul className="space-y-2">
                  {walkthrough.objectives.map((objective, idx) => (
                    <li
                      key={idx}
                      id={`objective-${idx}`}
                      className="flex gap-2 walkthrough-content scroll-mt-24"
                    >
                      <span className="text-blue-400 font-bold">•</span>
                      <span className="text-gray-300">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mobile TOC */}
            <div className="lg:hidden mb-8">
              <TableOfContents links={tocLinks} activeSection={activeSection} collapsible />
            </div>

            {/* Content sections */}
            <section className="mb-16 space-y-4">
              {walkthrough.content.map((content) => (
                <div
                  key={content.order}
                  id={`section-${content.order}`}
                  className="walkthrough-content scroll-mt-24"
                >
                  <WalkthroughContent
                    content={content}
                    onImageClick={handleImageClick}
                  />
                </div>
              ))}
            </section>

            {/* Footer navigation */}
            <div className="mt-16 pt-8 border-t border-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3">
                {/* Next Walkthrough - first on mobile, right on desktop */}
                {nextWalkthrough ? (
                  <Link
                    to={`/walkthroughs/${type}/${nextWalkthrough.slug}`}
                    className="group w-full sm:w-auto order-1 sm:order-2"
                    onMouseEnter={() => prefetchWalkthroughBySlug(type!, nextWalkthrough.slug)}
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gradient-to-r from-blue-600/20 to-blue-500/10 hover:from-blue-600/30 hover:to-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-blue-400 mb-0.5">Next</div>
                        <div className="text-sm font-medium text-white truncate">
                          {nextWalkthrough.title}
                        </div>
                      </div>
                      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-blue-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link
                    to="/walkthroughs"
                    className="group w-full sm:w-auto order-1 sm:order-2"
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gradient-to-r from-blue-600/20 to-blue-500/10 hover:from-blue-600/30 hover:to-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-blue-400 mb-0.5">Finished</div>
                        <div className="text-sm font-medium text-white">
                          All Walkthroughs
                        </div>
                      </div>
                      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-blue-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                )}

                {/* Previous Walkthrough - second on mobile, left on desktop */}
                {previousWalkthrough ? (
                  <Link
                    to={`/walkthroughs/${type}/${previousWalkthrough.slug}`}
                    className="group w-full sm:w-auto order-2 sm:order-1"
                    onMouseEnter={() => prefetchWalkthroughBySlug(type!, previousWalkthrough.slug)}
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition-all duration-200">
                      <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-gray-700 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5">Previous</div>
                        <div className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">
                          {previousWalkthrough.title}
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

export default WalkthroughPage;