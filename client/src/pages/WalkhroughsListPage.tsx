import { useParams, Link } from 'react-router-dom';
import { useWalkthroughsByType } from '../hooks/useWalkthroughs';
import { ApiError } from '../services/api';
import { Package, MapPin, ChevronRight, BookOpen } from 'lucide-react';
import ErrorPage from './ErrorPage';
import { WALKTHROUGHS } from '../constants/navigation';
import { usePrefetch } from '../hooks/usePrefetch';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';

export default function WalkthroughsListPage() {
  const { type } = useParams<{ type: string }>();
  const { prefetchWalkthroughBySlug } = usePrefetch()

  // Validate type exists before fetching
  const isValidType = WALKTHROUGHS.some(w => w.slug === type);

  const { data: walkthroughs, isLoading, isError, error } = useWalkthroughsByType(type!);

  const displayType = type?.replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Check for invalid type FIRST (before loading state)
  if (!isValidType) {
    return <ErrorPage code={404} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-main bg-primary">
        <div className="container mx-auto px-3 py-8">
          {/* Header skeleton */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <div className="h-10 md:h-14 w-80 bg-gray-700 rounded-lg animate-pulse"></div>
            </h1>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="w-4 h-5 bg-purple-400/50 rounded animate-pulse"></div>
                <div className="h-4 w-28 bg-purple-300/30 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Grid skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-secondary border border-zinc-800 rounded-lg overflow-hidden">
                <div className="aspect-video bg-tertiary animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-tertiary rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-tertiary rounded w-full animate-pulse" />
                  <div className="h-4 bg-tertiary rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Use ErrorPage for API errors
  if (isError) {
    const apiError = error as ApiError;
    return <ErrorPage code={apiError?.status || 500} />;
  }

  // Use ErrorPage for empty results
  if (!walkthroughs || walkthroughs.length === 0) {
    return <ErrorPage code={404} />;
  }

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title={displayType!}
        description={`Complete ${displayType} walkthroughs for Stellar Blade. ${walkthroughs.length} detailed guides with step-by-step instructions and screenshots.`}
        canonical={`/walkthroughs/${type}`}
      />
      <StructuredData
        type="CollectionPage"
        headline={`${displayType} - Stellar Blade Walkthroughs`}
        description={`All ${walkthroughs.length} ${displayType} walkthroughs for Stellar Blade.`}
        extraSchemas={[{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${displayType} Walkthroughs`,
          numberOfItems: walkthroughs.length,
          itemListElement: walkthroughs.map((w, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: w.title,
            url: `https://stellarbladeguide.com/walkthroughs/${type}/${w.slug}`,
            ...(w.thumbnail_url && { image: w.thumbnail_url })
          }))
        }]}
      />

      <div className="container mx-auto px-3 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {displayType}
            </span>
          </h1>

          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/30 rounded-lg">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">
                {walkthroughs.length} {walkthroughs.length === 1 ? 'Walkthrough' : 'Walkthroughs'}
              </span>
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {walkthroughs.map((walkthrough) => (
            <Link
              key={walkthrough.id}
              to={`/walkthroughs/${type}/${walkthrough.slug}`}
              onMouseEnter={() => prefetchWalkthroughBySlug(type!, walkthrough.slug)}
              className="group block"
            >
              <div className="bg-secondary border border-zinc-800 rounded-lg overflow-hidden 
                            transition-all duration-200 h-full
                            hover:border-zinc-700 hover:bg-secondary/80
                            hover:shadow-xl hover:shadow-black/30
                            hover:-translate-y-1">

                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-tertiary to-secondary 
                              relative overflow-hidden">

                  {walkthrough.thumbnail_url ? (
                    <img
                      src={walkthrough.thumbnail_url}
                      alt={walkthrough.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-zinc-700 group-hover:text-zinc-600 transition-colors" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Title */}
                  <h2 className="text-xl font-semibold text-white mb-2 line-clamp-2
                                group-hover:text-zinc-100 transition-colors">
                    {walkthrough.title}
                  </h2>

                  {/* Subtitle */}
                  {walkthrough.subtitle && (
                    <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                      {walkthrough.subtitle}
                    </p>
                  )}

                  {/* Metadata footer */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800">
                    {/* Level */}
                    {walkthrough.level && (
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-400 font-medium">
                          {walkthrough.level}
                        </span>
                      </div>
                    )}

                    {/* Arrow icon */}
                    <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}