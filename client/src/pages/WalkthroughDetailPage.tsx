import { useEffect, useLayoutEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useWalkthrough, useWalkthroughsByType } from '../hooks/useWalkthroughs'
import QueryError from '../components/QueryError'
import { useToast } from '../context/ToastContext'
import { List, ArrowLeft, Clock, Gift, Loader2 } from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import WalkthroughContent from '../components/WalkthroughContent'
import { parseDescription } from '../utils/parseDescription'
import WalkthroughContentSkeleton from '../components/WalkthroughContentSkeleton'
import ErrorPage from './ErrorPage'
import TableOfContents from '../components/TableOfContents'
import TableOfContentsSkeleton from '../components/TableOfContentsSkeleton'
import { usePrefetch } from '../hooks/usePrefetch'
import { ogImageUrl } from '../utils/cloudinary'
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import CommentSection from '../components/comments/CommentSection'
import FloatingTOC from '../components/FloatingTOC'
import BackToTop from '../components/BackToTop'
import MobileBackToTop from '../components/MobileBackToTop'

function WalkthroughDetailPage() {
  const { type, slug } = useParams<{ type: string; slug: string }>();
  const location = useLocation();

  const { data: walkthrough, isLoading, isError, error, refetch } = useWalkthrough(type!, slug!);
  const { data: allWalkthroughs = [], isError: navError } = useWalkthroughsByType(type!);
  const { prefetchWalkthroughBySlug } = usePrefetch();
  const { showToast } = useToast();
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

  // Prev/next nav is secondary content — surface its load failure as a toast,
  // but only when the page itself loaded (a failed main query already shows the
  // full-page QueryError, so a toast on top would be redundant).
  useEffect(() => {
    if (navError && !isError) showToast("Couldn't load previous/next walkthroughs.");
  }, [navError, isError, showToast]);

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

  // Scroll to hash on load or hash change
  useLayoutEffect(() => {
    if (walkthrough && location.hash) {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) {
        const offset = 80;
        const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'instant' });
      }
    }
  }, [walkthrough, location.hash]);

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
            <aside className="hidden lg:block w-64 shrink-0">
              <TableOfContentsSkeleton />
            </aside>

            {/* Skeleton main content */}
            <div className="flex-1 min-w-0">
              {/* Page header skeleton */}
              <div className="mb-8">
                <div className="h-9 md:h-10 w-96 bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-6 w-80 bg-gray-700 rounded mt-2 animate-pulse" />
                {type !== 'main-story' && (
                  <div className="h-5 w-72 bg-gray-700/50 rounded mt-2 animate-pulse" />
                )}
              </div>

              {/* Objectives skeleton */}
              <div className="mb-4 p-4 bg-secondary rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-purple-400/50 rounded animate-pulse"></div>
                  <div className="h-7 w-32 bg-gray-700 rounded animate-pulse"></div>
                </div>
                <ul className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-purple-400 font-bold">•</span>
                      <div className="h-6 w-96 bg-gray-700 rounded animate-pulse"></div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Walkthrough content skeletons */}
              <section className="mb-16 space-y-4">
                <WalkthroughContentSkeleton />
                <WalkthroughContentSkeleton />
                <WalkthroughContentSkeleton />
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return <QueryError error={error} onRetry={() => void refetch()} />;
  }

  if (!walkthrough) {
    return <ErrorPage code={404} />;
  }

  function slugifySection(title: string): string {
    return title.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const tocLinks = [{
    mainLink: `#${slugifySection(walkthrough.content.find(c => c.section_title)?.section_title || 'start')}`,
    title: walkthrough.title,
    subLinks: walkthrough.content
      .filter(content => content.section_title)
      .map(content => ({
        href: `#${slugifySection(content.section_title!)}`,
        title: content.section_title!
      }))
  }];

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title={walkthrough.title}
        description={`${walkthrough.title} walkthrough for Stellar Blade${walkthrough.level ? ` (${walkthrough.level})` : ''}. Step-by-step guide with screenshots, tips, and boss strategies.`}
        canonical={`/walkthroughs/${type}/${slug}`}
        ogImage={(() => {
          const src = walkthrough.thumbnail_url
            ?? walkthrough.content.find(c => c.images?.length > 0)?.images[0]?.url;
          return src ? ogImageUrl(src) : undefined;
        })()}
      />
      <StructuredData
        type="WebPage"
        headline={walkthrough.title}
        description={`${walkthrough.title} walkthrough for Stellar Blade${walkthrough.level ? ` (${walkthrough.level})` : ''}. Step-by-step guide with screenshots, tips, and boss strategies.`}
        extraSchemas={[{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: walkthrough.title,
          ...(walkthrough.subtitle && { alternativeHeadline: walkthrough.subtitle }),
          description: `${walkthrough.title} walkthrough for Stellar Blade${walkthrough.level ? ` (${walkthrough.level})` : ''}. Step-by-step guide with screenshots, tips, and boss strategies.`,
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
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-4 pb-4">
              <TableOfContents
                links={tocLinks}
                activeSection={activeSection}
              />
              <div className="mt-3">
                <BackToTop />
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">
                {walkthrough.title}
              </h1>
              {walkthrough.subtitle && (
                <p className="text-gray-300">{walkthrough.subtitle}</p>
              )}
              {walkthrough.available_after && (
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{walkthrough.available_after}</span>
                </div>
              )}
            </div>

            {/* Objectives */}
            {walkthrough.objectives && walkthrough.objectives.length > 0 && (
              <div id="objectives" className="mb-4 p-4 bg-secondary rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <List className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-gray-100">Objectives</h2>
                </div>
                <ul className="space-y-2">
                  {walkthrough.objectives.map((objective, idx) => (
                    <li
                      key={idx}
                      id={`objective-${idx}`}
                      className="flex gap-2 walkthrough-content scroll-mt-24"
                    >
                      <span className="text-purple-400 font-bold">•</span>
                      <span className="text-gray-300">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mobile TOC */}
            <div className="lg:hidden mb-4">
              <FloatingTOC
                links={tocLinks}
                activeSection={activeSection}
              />
              <MobileBackToTop />
            </div>

            {/* Content sections */}
            <section className="mb-4 space-y-4">
              {walkthrough.content.map((content) => (
                <div
                  key={`${walkthrough.slug}-${content.order}`}
                  id={content.section_title ? slugifySection(content.section_title) : `section-${content.order}`}
                  className="walkthrough-content scroll-mt-24"
                >
                  <WalkthroughContent
                    content={content}
                    onImageClick={handleImageClick}
                  />
                </div>
              ))}
            </section>

            {/* Rewards */}
            {walkthrough.rewards && walkthrough.rewards.length > 0 && (
              <div className="mb-16 p-4 bg-secondary rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-gray-100">Rewards</h2>
                </div>
                <ul className="space-y-1.5">
                  {walkthrough.rewards.map((reward, idx) => (
                    <li key={idx} className="flex gap-2 text-gray-300">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span className="flex-1">{parseDescription(reward)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer navigation */}
            <div className="mt-16 pt-8 border-t border-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3">
                {/* Next Walkthrough - first on mobile, right on desktop */}
                {nextWalkthrough ? (
                  <Link
                    to={`/walkthroughs/${type}/${nextWalkthrough.slug}`}
                    className="group w-full sm:w-auto order-1 sm:order-2"
                    onMouseEnter={() => void prefetchWalkthroughBySlug(type!, nextWalkthrough.slug)}
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-linear-to-r from-cyan-600/20 to-cyan-500/10 hover:from-cyan-600/30 hover:to-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-cyan-400 mb-0.5">Next</div>
                        <div className="text-sm font-medium text-white truncate">
                          {nextWalkthrough.title}
                        </div>
                      </div>
                      <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-cyan-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link
                    to="/walkthroughs"
                    className="group w-full sm:w-auto order-1 sm:order-2"
                  >
                    <div className="flex items-center gap-3 p-3 md:px-5 md:py-4 bg-linear-to-r from-cyan-600/20 to-cyan-500/10 hover:from-cyan-600/30 hover:to-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-cyan-400 mb-0.5">Finished</div>
                        <div className="text-sm font-medium text-white">
                          All Walkthroughs
                        </div>
                      </div>
                      <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-cyan-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                )}

                {/* Previous Walkthrough - second on mobile, left on desktop */}
                {previousWalkthrough ? (
                  <Link
                    to={`/walkthroughs/${type}/${previousWalkthrough.slug}`}
                    className="group w-full sm:w-auto order-2 sm:order-1"
                    onMouseEnter={() => void prefetchWalkthroughBySlug(type!, previousWalkthrough.slug)}
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
            <CommentSection contentType="walkthrough" contentId={walkthrough.id} />
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
        render={{
          iconLoading: () => <Loader2 className="w-10 h-10 text-white animate-spin" />,
        }}
      />
    </div>
  );
}

export default WalkthroughDetailPage;