import { Link } from 'react-router-dom';
import { Map, ChevronRight } from 'lucide-react';
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
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Levels
            </span>
            <span className="block text-2xl text-gray-400 font-normal mt-2">
              All collectibles organized by level
            </span>
          </h1>

          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600/20 to-green-500/10 border border-green-500/30 rounded-lg">
              <Map className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-gray-300">
                {LEVELS.length} Levels
              </span>
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((level) => (
            <Link
              key={level.slug}
              to={`/levels/${level.slug}`}
              onMouseEnter={() => prefetchLevel(level.slug)}
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
                  {LEVEL_IMAGES[level.slug] ? (
                    <img
                      src={LEVEL_IMAGES[level.slug]}
                      alt={level.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Map className="w-16 h-16 text-zinc-700 group-hover:text-zinc-600 transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-white mb-2
                                group-hover:text-zinc-100 transition-colors">
                    {level.name}
                  </h2>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800">
                    <span className="text-xs text-zinc-400 font-medium">
                      View collectibles
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