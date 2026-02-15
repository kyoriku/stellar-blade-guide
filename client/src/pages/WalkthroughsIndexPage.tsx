import { Link } from 'react-router-dom';
import { Book } from 'lucide-react';
import { WALKTHROUGHS } from '../constants/navigation';
import { WALKTHROUGH_IMAGES } from '../constants/categoryImages';
import { usePrefetch } from '../hooks/usePrefetch';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';

export default function WalkthroughsIndexPage() {
  const { prefetchWalkthroughsByType } = usePrefetch();

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title="Walkthroughs"
        description={`Complete walkthrough guides for Stellar Blade. Browse ${WALKTHROUGHS.length} categories including main story missions, side quests, and more.`}
        canonical="/walkthroughs"
      />
      <StructuredData
        type="CollectionPage"
        headline="Stellar Blade Walkthroughs"
        description={`Complete walkthrough guides for all Stellar Blade missions.`}
        extraSchemas={[{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Stellar Blade Walkthrough Categories',
          numberOfItems: WALKTHROUGHS.length,
          itemListElement: WALKTHROUGHS.map((cat, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: cat.name,
            url: `https://stellarbladeguide.com/walkthroughs/${cat.slug}`
          }))
        }]}
      />

      <div className="container mx-auto px-3 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Walkthroughs</h1>
          <p className="text-gray-300">Complete guides for all missions</p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {WALKTHROUGHS.map((category) => (
            <Link
              key={category.slug}
              to={`/walkthroughs/${category.slug}`}
              onMouseEnter={() => prefetchWalkthroughsByType(category.slug)}
              className="group block"
            >
              <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-zinc-800
                            hover:border-zinc-600 transition-all duration-200
                            hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
                {WALKTHROUGH_IMAGES[category.slug] ? (
                  <img
                    src={WALKTHROUGH_IMAGES[category.slug]}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-tertiary flex items-center justify-center">
                    <Book className="w-12 h-12 text-zinc-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute bottom-3 left-4 text-lg font-semibold text-white drop-shadow-lg">
                  {category.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}