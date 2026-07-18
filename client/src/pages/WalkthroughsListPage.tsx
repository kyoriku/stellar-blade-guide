import { useParams, Link } from 'react-router-dom';
import { useWalkthroughsByType } from '../hooks/useWalkthroughs';
import QueryError from '../components/QueryError';
import { MapPin, BookOpen } from 'lucide-react';
import ErrorPage from './ErrorPage';
import { WALKTHROUGHS } from '../constants/navigation';
import { usePrefetch } from '../hooks/usePrefetch';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import { thumbnailUrl, buildSrcSet } from '../utils/image';

export default function WalkthroughsListPage() {
  const { type } = useParams<{ type: string }>();
  const { prefetchWalkthroughBySlug } = usePrefetch();

  const isValidType = WALKTHROUGHS.some(w => w.slug === type);
  const { data: walkthroughs, isLoading, isError, error, refetch } = useWalkthroughsByType(type!);

  const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
    'nier-dlc': 'NieR: Automata DLC',
    'nikke-dlc': 'Goddess of Victory: Nikke DLC',
    // 'bulletin-board-requests': 'Bulletin Board Requests',
  };

  const displayType = DISPLAY_NAME_OVERRIDES[type!] ?? type?.replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (!isValidType) {
    return <ErrorPage code={404} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-main bg-primary">
        <div className="container mx-auto px-3 py-8">
          <div className="mb-8">
            <div className="h-9 md:h-10 w-64 bg-gray-700 rounded-lg animate-pulse" />
            <div className="h-5 w-40 bg-gray-700/50 rounded mt-2 animate-pulse" />
          </div>
          {/* Card skeletons on desktop */}
          <div className="hidden md:grid gap-4 grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-zinc-800">
                <div className="aspect-video bg-tertiary animate-pulse" />
                <div className="p-4 space-y-2 bg-secondary">
                  <div className="h-4 bg-tertiary rounded w-full animate-pulse" />
                  <div className="h-3 bg-tertiary rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          {/* Compact list skeletons on mobile */}
          <div className="md:hidden space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-20 bg-secondary rounded-lg border border-zinc-800 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return <QueryError error={error} onRetry={() => void refetch()} />;
  }

  if (!walkthroughs || walkthroughs.length === 0) {
    return <ErrorPage code={404} />;
  }

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title={displayType}
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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">{displayType}</h1>
          <p className="text-gray-300 mt-2 max-w-3xl">
            {walkthroughs.length} {displayType} {walkthroughs.length === 1 ? 'walkthrough' : 'walkthroughs'} for Stellar Blade with step-by-step instructions, screenshots, and boss strategies.
          </p>
        </div>

        {/* Cards on desktop */}
        <div className="hidden md:grid gap-4 grid-cols-2 lg:grid-cols-3">
          {walkthroughs.map((walkthrough) => (
            <Link
              key={walkthrough.id}
              to={`/walkthroughs/${type}/${walkthrough.slug}`}
              onMouseEnter={() => void prefetchWalkthroughBySlug(type!, walkthrough.slug)}
              className="group block"
            >
              <div className="bg-secondary border border-zinc-800 rounded-lg overflow-hidden h-full
                            hover:border-zinc-600 transition-all duration-200
                            hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
                <div className="relative aspect-video overflow-hidden">
                  {walkthrough.thumbnail_url ? (
                    <img
                      src={thumbnailUrl(walkthrough.thumbnail_url, 640)}
                      srcSet={buildSrcSet(walkthrough.thumbnail_url)}
                      sizes="(min-width: 1024px) calc(33vw - 2rem), calc(50vw - 2rem)"
                      alt={walkthrough.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-tertiary flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-lg font-semibold text-gray-100 drop-shadow-lg">
                    {walkthrough.title}
                  </span>
                </div>
                <div className="p-4">
                  {walkthrough.subtitle && (
                    <p className="text-sm text-gray-300 line-clamp-1 mb-2">{walkthrough.subtitle}</p>
                  )}
                  <div className="flex items-center gap-4">
                    {walkthrough.level && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{walkthrough.level}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Compact list on mobile with prominent thumbnails */}
        <div className="md:hidden space-y-2">
          {walkthroughs.map((walkthrough) => (
            <Link
              key={walkthrough.id}
              to={`/walkthroughs/${type}/${walkthrough.slug}`}
              onMouseEnter={() => void prefetchWalkthroughBySlug(type!, walkthrough.slug)}
              className="group block"
            >
              <div className="flex items-stretch bg-secondary border border-zinc-800 rounded-lg overflow-hidden
                    hover:border-zinc-600 transition-all duration-200">
                <div className="w-2/5 shrink-0 aspect-video overflow-hidden">
                  {walkthrough.thumbnail_url ? (
                    <img
                      src={thumbnailUrl(walkthrough.thumbnail_url, 640)}
                      srcSet={buildSrcSet(walkthrough.thumbnail_url)}
                      sizes="40vw"
                      alt={walkthrough.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-tertiary flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-zinc-700" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                  <h3 className="text-base font-semibold text-gray-100 line-clamp-1 group-hover:text-white transition-colors">
                    {walkthrough.title}
                  </h3>
                  {walkthrough.subtitle && (
                    <p className="text-sm text-gray-300 line-clamp-1 mt-0.5">{walkthrough.subtitle}</p>
                  )}
                  {walkthrough.level && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{walkthrough.level}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}