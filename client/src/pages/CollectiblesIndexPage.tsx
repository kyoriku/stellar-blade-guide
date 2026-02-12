import { Link } from 'react-router-dom';
import { Compass, ChevronRight } from 'lucide-react';
import { COLLECTIBLES } from '../constants/navigation';
import { COLLECTIBLE_IMAGES } from '../constants/categoryImages';
import { usePrefetch } from '../hooks/usePrefetch';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';

export default function CollectiblesIndexPage() {
  const { prefetchCollectiblesByType } = usePrefetch();

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Stellar Blade Collectible Types',
    description: `All ${COLLECTIBLES.length} collectible types in Stellar Blade`,
    numberOfItems: COLLECTIBLES.length,
    itemListElement: COLLECTIBLES.map((type, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: type.name,
      url: `https://stellarbladeguide.com/collectibles/${type.slug}`
    }))
  };

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title="Collectibles"
        description={`Browse all ${COLLECTIBLES.length} collectible types in Stellar Blade. Find every Beta Core, Nano Suit, Document, Can, and more with screenshots and locations.`}
        canonical="/collectibles"
      />
      <StructuredData
        type="CollectionPage"
        headline="Stellar Blade Collectibles"
        description={`Browse all ${COLLECTIBLES.length} collectible types in Stellar Blade.`}
        extraSchemas={[itemListSchema]}
      />
      <div className="container mx-auto px-3 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Collectibles
            </span>
            <span className="block text-2xl text-gray-400 font-normal mt-2">
              Find every collectible by type
            </span>
          </h1>

          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/30 rounded-lg">
              <Compass className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">
                {COLLECTIBLES.length} Types
              </span>
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {COLLECTIBLES.map((type) => (
            <Link
              key={type.slug}
              to={`/collectibles/${type.slug}`}
              onMouseEnter={() => prefetchCollectiblesByType(type.slug)}
              className="group block"
            >
              <div className="bg-secondary border border-zinc-800 rounded-lg overflow-hidden 
                            transition-all duration-200 h-full
                            hover:border-zinc-700 hover:bg-secondary/80
                            hover:shadow-xl hover:shadow-black/30
                            hover:-translate-y-1">

                {/* Image Header */}
                <div className="aspect-video bg-gradient-to-br from-tertiary to-secondary 
                              relative overflow-hidden border-b border-zinc-800">
                  {COLLECTIBLE_IMAGES[type.slug] ? (
                    <img
                      src={COLLECTIBLE_IMAGES[type.slug]}
                      alt={type.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Compass className="w-16 h-16 text-zinc-700 group-hover:text-zinc-600 transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-white mb-2
                                group-hover:text-zinc-100 transition-colors">
                    {type.name}
                  </h2>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800">
                    <span className="text-xs text-zinc-400 font-medium">
                      View all locations
                    </span>
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