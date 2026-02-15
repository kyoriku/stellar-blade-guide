import { useParams, Link } from 'react-router-dom';
import { useWalkthroughsByType } from '../hooks/useWalkthroughs';
import { ApiError } from '../services/api';
import { MapPin, BookOpen } from 'lucide-react';
import ErrorPage from './ErrorPage';
import { WALKTHROUGHS } from '../constants/navigation';
import { usePrefetch } from '../hooks/usePrefetch';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';

export default function WalkthroughsListPage() {
  const { type } = useParams<{ type: string }>();
  const { prefetchWalkthroughBySlug } = usePrefetch();

  const isValidType = WALKTHROUGHS.some(w => w.slug === type);
  const { data: walkthroughs, isLoading, isError, error } = useWalkthroughsByType(type!);

  const displayType = type?.replace(/-/g, ' ')
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-zinc-800">
                <div className="aspect-[16/10] bg-tertiary animate-pulse" />
                <div className="p-4 space-y-2 bg-secondary">
                  <div className="h-4 bg-tertiary rounded w-full animate-pulse" />
                  <div className="h-3 bg-tertiary rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const apiError = error as ApiError;
    return <ErrorPage code={apiError?.status || 500} />;
  }

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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{displayType}</h1>
          <p className="text-gray-300">{walkthroughs.length} {walkthroughs.length === 1 ? 'walkthrough' : 'walkthroughs'}</p>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {walkthroughs.map((walkthrough) => (
            <Link
              key={walkthrough.id}
              to={`/walkthroughs/${type}/${walkthrough.slug}`}
              onMouseEnter={() => prefetchWalkthroughBySlug(type!, walkthrough.slug)}
              className="group block"
            >
              <div className="bg-secondary border border-zinc-800 rounded-lg overflow-hidden h-full
                            hover:border-zinc-600 transition-all duration-200
                            hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">

                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  {walkthrough.thumbnail_url ? (
                    <img
                      src={walkthrough.thumbnail_url}
                      alt={walkthrough.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-tertiary flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#151b23]/80 via-[#151b23]/20 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-lg font-semibold text-white drop-shadow-lg">
                    {walkthrough.title}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  {walkthrough.subtitle && (
                    <p className="text-sm text-gray-400 line-clamp-1 mb-2">{walkthrough.subtitle}</p>
                  )}
                  {walkthrough.level && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{walkthrough.level}</span>
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