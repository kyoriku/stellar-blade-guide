import { Link } from 'react-router-dom';
import { Book, ChevronRight } from 'lucide-react';
import { WALKTHROUGHS } from '../constants/navigation';
import { WALKTHROUGH_IMAGES } from '../constants/categoryImages';
import { usePrefetch } from '../hooks/usePrefetch';

export default function WalkthroughsIndexPage() {
  const { prefetchWalkthroughsByType } = usePrefetch();

  return (
    <div className="min-h-main bg-primary">
      <div className="container mx-auto px-3 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Walkthroughs
            </span>
            <span className="block text-2xl text-gray-400 font-normal mt-2">
              Complete guides for all missions
            </span>
          </h1>

          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg">
              <Book className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">
                {WALKTHROUGHS.length} Categories
              </span>
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {WALKTHROUGHS.map((category) => (
            <Link
              key={category.slug}
              to={`/walkthroughs/${category.slug}`}
              onMouseEnter={() => prefetchWalkthroughsByType(category.slug)}
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
                  {WALKTHROUGH_IMAGES[category.slug] ? (
                    <img
                      src={WALKTHROUGH_IMAGES[category.slug]}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Book className="w-16 h-16 text-zinc-700 group-hover:text-zinc-600 transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-white mb-2
                                group-hover:text-zinc-100 transition-colors">
                    {category.name}
                  </h2>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800">
                    <span className="text-xs text-zinc-400 font-medium">
                      View all guides
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