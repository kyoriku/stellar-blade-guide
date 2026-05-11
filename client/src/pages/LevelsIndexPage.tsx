import { Map } from "lucide-react";
import CategoryCard from "../components/CategoryCard";
import { LEVELS } from "../constants/navigation";
import { LEVEL_IMAGES } from "../constants/categoryImages";
import { usePrefetch } from "../hooks/usePrefetch";
import SEO from "../components/SEO";
import StructuredData from "../components/StructuredData";

const LEVELS_ITEM_LIST = LEVELS.map((level, i) => ({
  "@type": "ListItem",
  position: i + 1,
  name: level.name,
  url: `https://stellarbladeguide.com/levels/${level.slug}`,
}));

function LevelsIndexPage() {
  const { prefetchLevel } = usePrefetch();

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title="Levels"
        description={`All ${LEVELS.length} levels in Stellar Blade with 800+ collectibles organized by location. Screenshots and guides for every item.`}
        canonical="/levels"
      />

      <StructuredData
        type="CollectionPage"
        headline="Stellar Blade Levels"
        description="Browse all Stellar Blade levels and find every collectible organized by location."
        extraSchemas={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Stellar Blade Levels",
            numberOfItems: LEVELS.length,
            itemListElement: LEVELS_ITEM_LIST,
          },
        ]}
      />

      <div className="container mx-auto px-3 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">
            Levels
          </h1>
          <p className="text-gray-300 mt-2 max-w-3xl">
            All 10 levels in Stellar Blade with every collectible organized by
            location. Each level page includes Camps, Cans, Documents,
            Memorysticks, Nano Suits, and more - with screenshots and detailed
            directions.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((level) => (
            <CategoryCard
              key={level.slug}
              to={`/levels/${level.slug}`}
              imageUrl={LEVEL_IMAGES[level.slug]}
              name={level.name}
              FallbackIcon={Map}
              onMouseEnter={() => void prefetchLevel(level.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default LevelsIndexPage;
