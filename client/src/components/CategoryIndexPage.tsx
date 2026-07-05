import type { ElementType } from 'react';
import CategoryCard from './CategoryCard';
import SEO from './SEO';
import StructuredData from './StructuredData';
import { usePrefetch } from '../hooks/usePrefetch';

const SITE_URL = 'https://stellarbladeguide.com';

type PrefetchFns = ReturnType<typeof usePrefetch>;

export interface CategoryIndexConfig {
  /** Route segment with leading slash; drives the canonical URL, card links, and ItemList URLs. */
  basePath: string;
  /** Page name — used for both the SEO <title> and the visible <h1>. */
  title: string;
  metaDescription: string;
  /** Intro paragraph rendered under the h1. */
  intro: string;
  structuredDataHeadline: string;
  structuredDataDescription: string;
  itemListName: string;
  items: ReadonlyArray<{ slug: string; name: string }>;
  images: Record<string, string>;
  fallbackIcon: ElementType<{ className?: string }>;
  /** Selects which usePrefetch function fires on card hover — they are hook-bound, so the hook result is injected at render. */
  prefetch: (fns: PrefetchFns, slug: string) => unknown;
}

function CategoryIndexPage({ config }: { config: CategoryIndexConfig }) {
  const prefetchFns = usePrefetch();
  const { basePath, title, items, images, fallbackIcon: FallbackIcon } = config;

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title={title}
        description={config.metaDescription}
        canonical={basePath}
      />
      <StructuredData
        type="CollectionPage"
        headline={config.structuredDataHeadline}
        description={config.structuredDataDescription}
        extraSchemas={[
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: config.itemListName,
            numberOfItems: items.length,
            itemListElement: items.map((item, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: item.name,
              url: `${SITE_URL}${basePath}/${item.slug}`,
            })),
          },
        ]}
      />

      <div className="container mx-auto px-3 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">
            {title}
          </h1>
          <p className="text-gray-300 mt-2 max-w-3xl">{config.intro}</p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <CategoryCard
              key={item.slug}
              to={`${basePath}/${item.slug}`}
              imageUrl={images[item.slug]}
              name={item.name}
              FallbackIcon={FallbackIcon}
              onMouseEnter={() => void config.prefetch(prefetchFns, item.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default CategoryIndexPage;
