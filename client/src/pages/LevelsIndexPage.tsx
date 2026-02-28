import { Link } from 'react-router-dom';
import { Map } from 'lucide-react';
import { LEVELS } from '../constants/navigation';
import { LEVEL_IMAGES } from '../constants/categoryImages';
import { usePrefetch } from '../hooks/usePrefetch';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';

export default function LevelsIndexPage() {
  const { prefetchLevel } = usePrefetch();

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title="Levels"
        description="Browse all Stellar Blade levels and find every collectible organized by location."
        canonical="/levels"
      />
      <StructuredData
        type="CollectionPage"
        headline="Stellar Blade Levels"
        description="Browse all Stellar Blade levels and find every collectible organized by location."
        extraSchemas={[{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Stellar Blade Levels',
          numberOfItems: LEVELS.length,
          itemListElement: LEVELS.map((level, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: level.name,
            url: `https://stellarbladeguide.com/levels/${level.slug}`
          }))
        }]}
      />
      <div className="container mx-auto px-3 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Levels</h1>
          <p className="text-gray-300">All collectibles organized by level</p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((level) => (
            <Link
              key={level.slug}
              to={`/levels/${level.slug}`}
              onMouseEnter={() => prefetchLevel(level.slug)}
              className="group block"
            >
              <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-zinc-800
                            hover:border-zinc-600 transition-all duration-200
                            hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
                {LEVEL_IMAGES[level.slug] ? (
                  <img
                    src={LEVEL_IMAGES[level.slug]}
                    alt={level.name}
                    fetchPriority='high'
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-tertiary flex items-center justify-center">
                    <Map className="w-12 h-12 text-zinc-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute bottom-3 left-4 text-lg font-semibold text-white drop-shadow-lg">
                  {level.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}