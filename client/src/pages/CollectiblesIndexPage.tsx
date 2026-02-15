import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { COLLECTIBLES } from '../constants/navigation';
import { COLLECTIBLE_IMAGES } from '../constants/categoryImages';
import { usePrefetch } from '../hooks/usePrefetch';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';

export default function CollectiblesIndexPage() {
  const { prefetchCollectiblesByType } = usePrefetch();

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title="Collectibles"
        description={`Browse all ${COLLECTIBLES.length} collectible types in Stellar Blade. Find every Document, Can, Memorystick, and more with screenshots and locations.`}
        canonical="/collectibles"
      />
      <StructuredData
        type="CollectionPage"
        headline="Stellar Blade Collectibles"
        description={`Browse all ${COLLECTIBLES.length} collectible types in Stellar Blade.`}
        extraSchemas={[{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Stellar Blade Collectible Types',
          numberOfItems: COLLECTIBLES.length,
          itemListElement: COLLECTIBLES.map((type, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: type.name,
            url: `https://stellarbladeguide.com/collectibles/${type.slug}`
          }))
        }]}
      />
      <div className="container mx-auto px-3 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Collectibles</h1>
          <p className="text-gray-300">Camps, Cans, Documents, Memorysticks, and Passcodes</p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {COLLECTIBLES.map((type) => (
            <Link
              key={type.slug}
              to={`/collectibles/${type.slug}`}
              onMouseEnter={() => prefetchCollectiblesByType(type.slug)}
              className="group block"
            >
              <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-zinc-800
                            hover:border-zinc-600 transition-all duration-200
                            hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
                {COLLECTIBLE_IMAGES[type.slug] ? (
                  <img
                    src={COLLECTIBLE_IMAGES[type.slug]}
                    alt={type.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-tertiary flex items-center justify-center">
                    <Compass className="w-12 h-12 text-zinc-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute bottom-3 left-4 text-lg font-semibold text-white drop-shadow-lg">
                  {type.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}